import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  loadDatabase,
  saveDatabase,
  logAudit,
  User,
  Dentist,
  Service,
  Appointment,
  BlogPost,
  GalleryItem,
  Testimonial,
  ContactMessage,
  PageSeo,
} from '../db/store.js';
import { signToken } from '../utils/jwt.js';
import {
  authenticate,
  authorize,
  optionalAuthenticate,
  rateLimitLogin,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { checkSlot, getDentistAvailability } from '../services/availability.js';
import { getClinicToday, minutesToTime, timeToMinutes } from '../../shared/clinicTime.js';
import { sendBookingConfirmationEmail } from '../services/email.js';

export const apiRouter = express.Router();

// ==========================================
// INPUT VALIDATION HELPERS
// ==========================================

const ROLES: User['role'][] = ['super_admin', 'doctor_manager', 'receptionist', 'doctor'];
const SERVICE_CATEGORIES: Service['category'][] = [
  'general',
  'cosmetic',
  'orthodontics',
  'implants',
  'pediatric',
  'whitening',
  'root_canal',
  'emergency',
];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function sendBadRequest(res: Response, message: string): void {
  res.status(400).json({ success: false, error: { message } });
}

// Returns the name of the first provided field that is not a string (undefined fields are skipped)
function firstNonStringField(fields: Record<string, unknown>): string | undefined {
  return Object.keys(fields).find(
    (key) => fields[key] !== undefined && typeof fields[key] !== 'string'
  );
}

function clampRating(value: unknown): number {
  const rating = Math.round(Number(value));
  if (!Number.isFinite(rating)) return 5;
  return Math.min(5, Math.max(1, rating));
}

type FieldType = 'string' | 'number' | 'boolean';

// Whitelists updatable fields and checks their types, so request bodies cannot overwrite ids or other internal fields
function pickFields(
  body: unknown,
  spec: Record<string, FieldType>
): { data: Record<string, string | number | boolean>; error?: string } {
  const data: Record<string, string | number | boolean> = {};
  const source = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  for (const [field, type] of Object.entries(spec)) {
    const value = source[field];
    if (value === undefined) continue;

    if (type === 'string') {
      if (typeof value !== 'string') return { data, error: `Field '${field}' must be text.` };
      data[field] = value.trim();
    } else if (type === 'number') {
      const num = Number(value);
      if (value === null || value === '' || !Number.isFinite(num)) {
        return { data, error: `Field '${field}' must be a number.` };
      }
      data[field] = num;
    } else {
      if (typeof value !== 'boolean') return { data, error: `Field '${field}' must be true or false.` };
      data[field] = value;
    }
  }

  return { data };
}

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

apiRouter.post('/auth/login', rateLimitLogin, (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    res.status(400).json({
      success: false,
      error: { message: 'Username and password are required.' },
    });
    return;
  }

  const db = loadDatabase();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase().trim()
  );

  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials or inactive account.' },
    });
    return;
  }

  const passwordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordValid) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials or inactive account.' },
    });
    return;
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    doctorId: user.doctorId,
  });

  logAudit(user.id, user.username, user.role, 'USER_LOGIN', `Successful login for user ${user.username}`);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        doctorId: user.doctorId,
      },
    },
  });
});

apiRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const user = db.users.find((u) => u.id === req.user?.userId);

  if (!user) {
    res.status(404).json({ success: false, error: { message: 'User not found.' } });
    return;
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      doctorId: user.doctorId,
      isActive: user.isActive,
    },
  });
});

apiRouter.put('/auth/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { username, currentPassword, newPassword, fullName, email } = req.body;

  const invalidField = firstNonStringField({ username, currentPassword, newPassword, fullName, email });
  if (invalidField) {
    sendBadRequest(res, `Field '${invalidField}' must be text.`);
    return;
  }

  const db = loadDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user?.userId);

  if (userIndex === -1) {
    res.status(404).json({ success: false, error: { message: 'User not found.' } });
    return;
  }

  const user = db.users[userIndex];

  // If changing password, must verify currentPassword
  if (newPassword) {
    if (!currentPassword || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
      res.status(400).json({
        success: false,
        error: { message: 'Current password is incorrect.' },
      });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: { message: 'New password must be at least 6 characters long.' },
      });
      return;
    }
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
  }

  // If changing username, check uniqueness
  if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
    const exists = db.users.some(
      (u) => u.id !== user.id && u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      res.status(409).json({
        success: false,
        error: { message: 'Username is already taken by another account.' },
      });
      return;
    }
    user.username = username.trim();
  }

  if (fullName) user.fullName = fullName.trim();
  if (email !== undefined) user.email = email.trim();
  user.updatedAt = new Date().toISOString();

  db.users[userIndex] = user;
  saveDatabase();

  logAudit(
    req.user!.userId,
    req.user!.username,
    req.user!.role,
    'PROFILE_UPDATED',
    `Updated profile credentials for ${user.username}`
  );

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
});

// ==========================================
// 2. ADMIN USER & STAFF MANAGEMENT (RBAC)
// ==========================================

apiRouter.get(
  '/users',
  authenticate,
  authorize(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const sanitized = db.users.map(({ passwordHash, ...rest }) => rest);
    res.json({ success: true, data: sanitized });
  }
);

apiRouter.post(
  '/users',
  authenticate,
  authorize(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { username, fullName, firstName, lastName, email, password, role, doctorId } = req.body;

    const invalidField = firstNonStringField({
      username,
      fullName,
      firstName,
      lastName,
      email,
      password,
      role,
      doctorId,
    });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }
    if (role !== undefined && !ROLES.includes(role)) {
      sendBadRequest(res, 'Invalid staff role.');
      return;
    }

    const resolvedFullName =
      fullName?.trim() ||
      `${firstName || ''} ${lastName || ''}`.trim();

    if (!username || !resolvedFullName || !password || !role) {
      res.status(400).json({
        success: false,
        error: { message: 'Username, first and last name, password, and role are required.' },
      });
      return;
    }

    const db = loadDatabase();
    const exists = db.users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      res.status(409).json({
        success: false,
        error: { message: 'Username is already taken.' },
      });
      return;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      username: username.trim(),
      fullName: resolvedFullName,
      firstName: firstName ? firstName.trim() : undefined,
      lastName: lastName ? lastName.trim() : undefined,
      email: email ? email.trim() : '',
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      doctorId: doctorId || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'USER_CREATED',
      `Created staff account '${newUser.username}' with role '${newUser.role}'`
    );

    const { passwordHash, ...sanitized } = newUser;
    res.status(201).json({ success: true, data: sanitized });
  }
);

apiRouter.put(
  '/users/:id',
  authenticate,
  authorize(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { fullName, firstName, lastName, email, role, isActive, doctorId } = req.body;

    const invalidField = firstNonStringField({ fullName, firstName, lastName, email, role, doctorId });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }
    if (role !== undefined && !ROLES.includes(role)) {
      sendBadRequest(res, 'Invalid staff role.');
      return;
    }

    const db = loadDatabase();
    const user = db.users.find((u) => u.id === id);

    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    if (fullName) user.fullName = fullName.trim();
    if (firstName !== undefined) user.firstName = firstName.trim() || undefined;
    if (lastName !== undefined) user.lastName = lastName.trim() || undefined;
    if (email !== undefined) user.email = email.trim();
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (doctorId !== undefined) user.doctorId = doctorId || undefined;
    user.updatedAt = new Date().toISOString();

    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'USER_UPDATED',
      `Updated user info for '${user.username}' (Active: ${user.isActive})`
    );

    const { passwordHash, ...sanitized } = user;
    res.json({ success: true, data: sanitized });
  }
);

// Super admin directly changing username and/or password for any staff member
apiRouter.put(
  '/users/:id/credentials',
  authenticate,
  authorize(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { username, newPassword } = req.body;

    const invalidField = firstNonStringField({ username, newPassword });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }

    const db = loadDatabase();
    const user = db.users.find((u) => u.id === id);

    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const exists = db.users.some(
        (u) => u.id !== user.id && u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (exists) {
        res.status(409).json({
          success: false,
          error: { message: 'Username is already taken by another user.' },
        });
        return;
      }
      user.username = username.trim();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          error: { message: 'Password must be at least 6 characters.' },
        });
        return;
      }
      user.passwordHash = bcrypt.hashSync(newPassword, 10);
    }

    user.updatedAt = new Date().toISOString();
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'CREDENTIALS_RESET',
      `Super Admin reset credentials for user account '${user.username}'`
    );

    const { passwordHash, ...sanitized } = user;
    res.json({ success: true, data: sanitized });
  }
);

apiRouter.delete(
  '/users/:id',
  authenticate,
  authorize(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();

    if (id === req.user?.userId) {
      res.status(400).json({
        success: false,
        error: { message: 'You cannot delete your own active super admin account.' },
      });
      return;
    }

    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    const removed = db.users.splice(index, 1)[0];
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'USER_DELETED',
      `Deleted user account '${removed.username}'`
    );

    res.json({ success: true, message: 'User account removed.' });
  }
);

// ==========================================
// 3. DOCTORS / DENTISTS MANAGEMENT
// ==========================================

apiRouter.get('/dentists', (req: Request, res: Response) => {
  const { all } = req.query;
  const db = loadDatabase();
  const dentists = all === 'true' ? db.dentists : db.dentists.filter((d) => d.isActive);
  res.json({ success: true, data: dentists });
});

apiRouter.get('/dentists/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  const dentist = db.dentists.find((d) => d.id === req.params.id);
  if (!dentist) {
    res.status(404).json({ success: false, error: { message: 'Dentist not found.' } });
    return;
  }
  res.json({ success: true, data: dentist });
});

apiRouter.post(
  '/dentists',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const {
      name,
      firstName,
      lastName,
      titlePrefix,
      title,
      specialization,
      bio,
      email,
      phone,
      qualifications,
      experienceYears,
      photoUrl,
      workingDays,
      workingHours,
    } = req.body;

    const invalidField = firstNonStringField({
      name,
      firstName,
      lastName,
      titlePrefix,
      title,
      specialization,
      bio,
      email,
      phone,
      qualifications,
      photoUrl,
    });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }

    const prefix = titlePrefix !== undefined ? titlePrefix : 'Dr.';
    const resolvedName =
      name?.trim() ||
      `${prefix ? prefix + ' ' : ''}${firstName || ''} ${lastName || ''}`.trim();

    if (!resolvedName || !specialization) {
      res.status(400).json({
        success: false,
        error: { message: 'Doctor first and last name, and specialization are required.' },
      });
      return;
    }

    const db = loadDatabase();
    const newDentist: Dentist = {
      id: `d-${Date.now()}`,
      name: resolvedName,
      firstName: firstName ? firstName.trim() : undefined,
      lastName: lastName ? lastName.trim() : undefined,
      titlePrefix: prefix || undefined,
      title: title || 'Dental Surgeon',
      specialization: specialization.trim(),
      bio: bio || '',
      email: email || '',
      phone: phone || '',
      qualifications: qualifications || '',
      experienceYears: Number(experienceYears) || 0,
      photoUrl: photoUrl || '/src/assets/images/viora_dentist_doctor_1791308053834.jpg',
      workingDays: workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      workingHours: workingHours || { start: '08:30', end: '17:30' },
      daysOff: [],
      isActive: true,
    };

    db.dentists.push(newDentist);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'DOCTOR_CREATED',
      `Added new doctor profile for ${newDentist.name} (${newDentist.specialization})`
    );

    res.status(201).json({ success: true, data: newDentist });
  }
);

apiRouter.put(
  '/dentists/:id',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const dentist = db.dentists.find((d) => d.id === id);

    if (!dentist) {
      res.status(404).json({ success: false, error: { message: 'Doctor profile not found.' } });
      return;
    }

    // Working days/hours and days off are only changed through the /schedule endpoint
    const { data, error } = pickFields(req.body, {
      name: 'string',
      firstName: 'string',
      lastName: 'string',
      titlePrefix: 'string',
      title: 'string',
      specialization: 'string',
      bio: 'string',
      email: 'string',
      phone: 'string',
      qualifications: 'string',
      experienceYears: 'number',
      photoUrl: 'string',
      isActive: 'boolean',
    });
    if (error) {
      sendBadRequest(res, error);
      return;
    }

    if (data.firstName || data.lastName) {
      const prefix = data.titlePrefix !== undefined ? data.titlePrefix : (dentist.titlePrefix || 'Dr.');
      const fName = data.firstName !== undefined ? data.firstName : (dentist.firstName || '');
      const lName = data.lastName !== undefined ? data.lastName : (dentist.lastName || '');
      data.name = data.name || `${prefix ? prefix + ' ' : ''}${fName} ${lName}`.trim();
    }
    Object.assign(dentist, data);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'DOCTOR_UPDATED',
      `Updated doctor profile for ${dentist.name}`
    );

    res.json({ success: true, data: dentist });
  }
);

apiRouter.put(
  '/dentists/:id/schedule',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { workingDays, workingHours, daysOff } = req.body;

    const isStringArray = (v: unknown): v is string[] =>
      Array.isArray(v) && v.every((item) => typeof item === 'string');

    if (workingDays !== undefined && !isStringArray(workingDays)) {
      sendBadRequest(res, 'Working days must be a list of weekday names.');
      return;
    }
    if (
      workingHours !== undefined &&
      !(
        workingHours &&
        typeof workingHours.start === 'string' &&
        typeof workingHours.end === 'string' &&
        TIME_PATTERN.test(workingHours.start) &&
        TIME_PATTERN.test(workingHours.end)
      )
    ) {
      sendBadRequest(res, 'Working hours must have start and end times in HH:mm format.');
      return;
    }
    if (daysOff !== undefined && !(isStringArray(daysOff) && daysOff.every((d) => DATE_PATTERN.test(d)))) {
      sendBadRequest(res, 'Days off must be a list of dates in YYYY-MM-DD format.');
      return;
    }

    const db = loadDatabase();
    const dentist = db.dentists.find((d) => d.id === id);

    if (!dentist) {
      res.status(404).json({ success: false, error: { message: 'Doctor profile not found.' } });
      return;
    }

    if (workingDays) dentist.workingDays = workingDays;
    if (workingHours) dentist.workingHours = { start: workingHours.start, end: workingHours.end };
    if (daysOff) dentist.daysOff = daysOff;

    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'SCHEDULE_UPDATED',
      `Updated clinical working hours and schedule for ${dentist.name}`
    );

    res.json({ success: true, data: dentist });
  }
);

apiRouter.delete(
  '/dentists/:id',
  authenticate,
  authorize(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const index = db.dentists.findIndex((d) => d.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });
      return;
    }

    const removed = db.dentists.splice(index, 1)[0];
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'DOCTOR_DELETED',
      `Removed doctor profile for ${removed.name}`
    );

    res.json({ success: true, message: 'Doctor removed successfully.' });
  }
);

// ==========================================
// 4. SERVICES MANAGEMENT
// ==========================================

apiRouter.get('/services', (_req: Request, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.services });
});

apiRouter.post(
  '/services',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { name, category, description, startingPrice, durationMinutes, iconName, isPopular } =
      req.body;

    const invalidField = firstNonStringField({ name, category, description, iconName });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }
    if (category !== undefined && !SERVICE_CATEGORIES.includes(category)) {
      sendBadRequest(res, 'Invalid service category.');
      return;
    }

    if (!name || !startingPrice) {
      res.status(400).json({
        success: false,
        error: { message: 'Service name and price are required.' },
      });
      return;
    }

    const db = loadDatabase();
    const newService: Service = {
      id: `s-${Date.now()}`,
      name: name.trim(),
      category: category || 'general',
      description: description || '',
      startingPrice: Number(startingPrice),
      durationMinutes: Number(durationMinutes) || 30,
      iconName: iconName || 'Sparkles',
      isPopular: Boolean(isPopular),
    };

    db.services.push(newService);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'SERVICE_CREATED',
      `Created service: ${newService.name} (ETB ${newService.startingPrice})`
    );

    res.status(201).json({ success: true, data: newService });
  }
);

apiRouter.put(
  '/services/:id',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const service = db.services.find((s) => s.id === id);

    if (!service) {
      res.status(404).json({ success: false, error: { message: 'Service not found.' } });
      return;
    }

    const { data, error } = pickFields(req.body, {
      name: 'string',
      category: 'string',
      description: 'string',
      startingPrice: 'number',
      durationMinutes: 'number',
      iconName: 'string',
      isPopular: 'boolean',
    });
    if (error) {
      sendBadRequest(res, error);
      return;
    }
    if (data.category !== undefined && !SERVICE_CATEGORIES.includes(data.category as Service['category'])) {
      sendBadRequest(res, 'Invalid service category.');
      return;
    }

    Object.assign(service, data);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'SERVICE_UPDATED',
      `Updated service: ${service.name}`
    );

    res.json({ success: true, data: service });
  }
);

apiRouter.delete(
  '/services/:id',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const index = db.services.findIndex((s) => s.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, error: { message: 'Service not found.' } });
      return;
    }

    const removed = db.services.splice(index, 1)[0];
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'SERVICE_DELETED',
      `Deleted service: ${removed.name}`
    );

    res.json({ success: true, message: 'Service removed successfully.' });
  }
);

// ==========================================
// 5. APPOINTMENTS & REAL-TIME AVAILABILITY
// ==========================================

apiRouter.get('/appointments/availability', (req: Request, res: Response) => {
  const { dentistId, date, duration, excludeAppointmentId } = req.query;

  if (!dentistId || !date) {
    res.status(400).json({
      success: false,
      error: { message: 'dentistId and date parameters are required.' },
    });
    return;
  }
  if (!DATE_PATTERN.test(String(date))) {
    sendBadRequest(res, 'Date must be in YYYY-MM-DD format.');
    return;
  }

  const durationMin = Math.min(480, Math.max(15, Number(duration) || 30));
  const availability = getDentistAvailability(
    String(dentistId),
    String(date),
    durationMin,
    excludeAppointmentId ? String(excludeAppointmentId) : undefined
  );

  res.json({ success: true, data: availability });
});

apiRouter.post('/appointments', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const {
    patientName,
    patientFirstName,
    patientLastName,
    patientPhone,
    patientEmail,
    dentistId,
    serviceId,
    date,
    startTime,
    paymentMethod,
    notes,
    isWalkIn,
  } = req.body;

  const invalidField = firstNonStringField({
    patientName,
    patientFirstName,
    patientLastName,
    patientPhone,
    patientEmail,
    dentistId,
    serviceId,
    date,
    startTime,
    paymentMethod,
    notes,
  });
  if (invalidField) {
    sendBadRequest(res, `Field '${invalidField}' must be text.`);
    return;
  }
  if (date !== undefined && !DATE_PATTERN.test(date)) {
    sendBadRequest(res, 'Date must be in YYYY-MM-DD format.');
    return;
  }
  if (startTime !== undefined && !TIME_PATTERN.test(startTime)) {
    sendBadRequest(res, 'Start time must be in HH:mm format.');
    return;
  }

  const resolvedPatientName =
    patientName?.trim() ||
    `${patientFirstName || ''} ${patientLastName || ''}`.trim() ||
    '';

  if (!resolvedPatientName || !patientPhone || !dentistId || !serviceId || !date || !startTime) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Patient first name, last name (or full name), phone number, doctor, treatment, date, and start time are required.',
      },
    });
    return;
  }

  const db = loadDatabase();
  const dentist = db.dentists.find((d) => d.id === dentistId && d.isActive);
  const service = db.services.find((s) => s.id === serviceId);

  if (!dentist || !service) {
    res.status(400).json({
      success: false,
      error: { message: 'Selected dentist or service is invalid.' },
    });
    return;
  }

  // Walk-ins are auto-confirmed, so only signed-in staff may register them
  if (isWalkIn && !req.user) {
    res.status(401).json({
      success: false,
      error: { message: 'Walk-in registration requires a staff login.' },
    });
    return;
  }

  // Schedule, clinic clock, and overlapping-booking checks (double-booking prevention)
  const slotCheck = checkSlot(dentist, date, startTime, service.durationMinutes, db.appointments);
  if (!slotCheck.ok) {
    res.status(slotCheck.status).json({ success: false, error: { message: slotCheck.message } });
    return;
  }

  // Calculate end time based on service duration
  const endTime = minutesToTime(timeToMinutes(startTime) + service.durationMinutes);

  const aptCount = db.appointments.length + 1;
  const appointmentNumber = `VIO-${8400 + aptCount}`;

  const appointment: Appointment = {
    id: `apt-${Date.now()}`,
    appointmentNumber,
    patientName: resolvedPatientName,
    patientFirstName: patientFirstName ? patientFirstName.trim() : undefined,
    patientLastName: patientLastName ? patientLastName.trim() : undefined,
    patientPhone: patientPhone.trim(),
    patientEmail: patientEmail ? patientEmail.trim() : undefined, // Optional email!
    dentistId: dentist.id,
    dentistName: dentist.name,
    serviceId: service.id,
    serviceName: service.name,
    date,
    startTime,
    endTime,
    status: isWalkIn ? 'confirmed' : 'pending',
    paymentMethod: paymentMethod || 'cash',
    notes: notes ? notes.trim() : '',
    isWalkIn: Boolean(isWalkIn),
    createdBy: req.user?.username || (isWalkIn ? 'Front Desk Walk-in' : 'Online Booking'),
    reminderSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.appointments.push(appointment);
  saveDatabase();

  // Trigger optional confirmation email
  sendBookingConfirmationEmail(appointment).catch((e) =>
    console.error('Email send failure:', e)
  );

  logAudit(
    req.user?.userId || 'guest',
    req.user?.username || 'online_patient',
    req.user?.role || 'guest',
    isWalkIn ? 'WALK_IN_APPOINTMENT_CREATED' : 'APPOINTMENT_BOOKED',
    `Booked appointment ${appointment.appointmentNumber} for ${appointment.patientName} with ${appointment.dentistName} on ${appointment.date} at ${appointment.startTime}`
  );

  res.status(201).json({
    success: true,
    data: appointment,
  });
});

apiRouter.get(
  '/appointments',
  authenticate,
  authorize(['super_admin', 'doctor_manager', 'receptionist', 'doctor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { date, status, dentistId, search } = req.query;
    const db = loadDatabase();

    let list = [...db.appointments];

    // Doctors only see their own appointments; an account not linked to a clinician profile sees none
    if (req.user?.role === 'doctor') {
      const ownDoctorId = req.user.doctorId;
      list = ownDoctorId ? list.filter((a) => a.dentistId === ownDoctorId) : [];
    }

    if (date) {
      list = list.filter((a) => a.date === String(date));
    }

    if (status) {
      list = list.filter((a) => a.status === String(status));
    }

    if (dentistId) {
      list = list.filter((a) => a.dentistId === String(dentistId));
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.patientPhone.toLowerCase().includes(q) ||
          (a.patientEmail && a.patientEmail.toLowerCase().includes(q)) ||
          a.appointmentNumber.toLowerCase().includes(q)
      );
    }

    // Sort descending by date and startTime
    list.sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      return b.startTime.localeCompare(a.startTime);
    });

    res.json({
      success: true,
      data: list,
      meta: { total: list.length },
    });
  }
);

apiRouter.put(
  '/appointments/:id/status',
  authenticate,
  authorize(['super_admin', 'doctor_manager', 'receptionist', 'doctor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ success: false, error: { message: 'Invalid status value.' } });
      return;
    }

    const db = loadDatabase();
    const apt = db.appointments.find((a) => a.id === id);

    if (!apt) {
      res.status(404).json({ success: false, error: { message: 'Appointment not found.' } });
      return;
    }

    if (req.user!.role === 'doctor' && (!req.user!.doctorId || apt.dentistId !== req.user!.doctorId)) {
      res.status(403).json({
        success: false,
        error: { message: 'Doctors can only update their own appointments.' },
      });
      return;
    }

    apt.status = status;
    apt.updatedAt = new Date().toISOString();
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'APPOINTMENT_STATUS_CHANGED',
      `Changed appointment ${apt.appointmentNumber} status to '${status}'`
    );

    res.json({ success: true, data: apt });
  }
);

apiRouter.put(
  '/appointments/:id/reschedule',
  authenticate,
  authorize(['super_admin', 'doctor_manager', 'receptionist']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { date, startTime } = req.body;

    if (!date || !startTime) {
      res.status(400).json({
        success: false,
        error: { message: 'New date and start time are required.' },
      });
      return;
    }
    if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
      sendBadRequest(res, 'Date must be in YYYY-MM-DD format.');
      return;
    }
    if (typeof startTime !== 'string' || !TIME_PATTERN.test(startTime)) {
      sendBadRequest(res, 'Start time must be in HH:mm format.');
      return;
    }

    const db = loadDatabase();
    const apt = db.appointments.find((a) => a.id === id);

    if (!apt) {
      res.status(404).json({ success: false, error: { message: 'Appointment not found.' } });
      return;
    }

    if (apt.status === 'cancelled' || apt.status === 'completed') {
      sendBadRequest(res, `A ${apt.status} appointment cannot be rescheduled.`);
      return;
    }

    const dentist = db.dentists.find((d) => d.id === apt.dentistId && d.isActive);
    if (!dentist) {
      sendBadRequest(res, 'The doctor for this appointment is no longer active.');
      return;
    }

    // Keep the treatment length; fall back to the current booked length if the service was removed
    const service = db.services.find((s) => s.id === apt.serviceId);
    const currentLength = timeToMinutes(apt.endTime) - timeToMinutes(apt.startTime);
    const duration = service ? service.durationMinutes : currentLength > 0 ? currentLength : 30;

    const slotCheck = checkSlot(dentist, date, startTime, duration, db.appointments, apt.id);
    if (!slotCheck.ok) {
      res.status(slotCheck.status).json({ success: false, error: { message: slotCheck.message } });
      return;
    }

    const endTime = minutesToTime(timeToMinutes(startTime) + duration);

    const oldDate = apt.date;
    const oldTime = apt.startTime;

    apt.date = date;
    apt.startTime = startTime;
    apt.endTime = endTime;
    apt.updatedAt = new Date().toISOString();
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'APPOINTMENT_RESCHEDULED',
      `Rescheduled ${apt.appointmentNumber} from ${oldDate} ${oldTime} to ${date} ${startTime}`
    );

    res.json({ success: true, data: apt });
  }
);

apiRouter.put(
  '/appointments/:id',
  authenticate,
  authorize(['super_admin', 'doctor_manager', 'receptionist']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const {
      paymentMethod,
      notes,
      patientName,
      patientFirstName,
      patientLastName,
      patientPhone,
      patientEmail,
      status,
    } = req.body;

    const invalidField = firstNonStringField({
      paymentMethod,
      notes,
      patientName,
      patientFirstName,
      patientLastName,
      patientPhone,
      patientEmail,
      status,
    });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }

    const db = loadDatabase();
    const apt = db.appointments.find((a) => a.id === id);

    if (!apt) {
      res.status(404).json({ success: false, error: { message: 'Appointment not found.' } });
      return;
    }

    if (paymentMethod) apt.paymentMethod = paymentMethod;
    if (notes !== undefined) apt.notes = notes;
    if (patientFirstName) apt.patientFirstName = patientFirstName;
    if (patientLastName) apt.patientLastName = patientLastName;
    if (patientName) {
      apt.patientName = patientName;
    } else if (patientFirstName || patientLastName) {
      apt.patientName = `${apt.patientFirstName || ''} ${apt.patientLastName || ''}`.trim();
    }
    if (patientPhone) apt.patientPhone = patientPhone;
    if (patientEmail !== undefined) apt.patientEmail = patientEmail;
    if (status) apt.status = status;
    apt.updatedAt = new Date().toISOString();
    saveDatabase();

    res.json({ success: true, data: apt });
  }
);

apiRouter.delete(
  '/appointments/:id',
  authenticate,
  authorize(['super_admin', 'doctor_manager', 'receptionist']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const apt = db.appointments.find((a) => a.id === id);

    if (!apt) {
      res.status(404).json({ success: false, error: { message: 'Appointment not found.' } });
      return;
    }

    apt.status = 'cancelled';
    apt.updatedAt = new Date().toISOString();
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'APPOINTMENT_CANCELLED',
      `Cancelled appointment ${apt.appointmentNumber}`
    );

    res.json({ success: true, message: 'Appointment cancelled.' });
  }
);

// ==========================================
// 6. BEFORE & AFTER GALLERY CMS
// ==========================================

apiRouter.get('/gallery', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const sorted = [...db.galleryItems].sort((a, b) => a.sortOrder - b.sortOrder);
  res.json({ success: true, data: sorted });
});

apiRouter.post(
  '/gallery',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const {
      title,
      category,
      description,
      beforeImageUrl,
      afterImageUrl,
      singleImageUrl,
      isBeforeAfter,
      doctorName,
    } = req.body;

    const invalidField = firstNonStringField({
      title,
      category,
      description,
      beforeImageUrl,
      afterImageUrl,
      singleImageUrl,
      doctorName,
    });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }

    if (!title) {
      res.status(400).json({ success: false, error: { message: 'Title is required.' } });
      return;
    }

    const db = loadDatabase();
    const newItem: GalleryItem = {
      id: `g-${Date.now()}`,
      title: title.trim(),
      category: category || 'Veneers & Aesthetics',
      description: description || '',
      beforeImageUrl: beforeImageUrl || undefined,
      afterImageUrl: afterImageUrl || undefined,
      singleImageUrl: singleImageUrl || undefined,
      isBeforeAfter: isBeforeAfter !== undefined ? Boolean(isBeforeAfter) : Boolean(beforeImageUrl && afterImageUrl),
      sortOrder: db.galleryItems.length + 1,
      doctorName: doctorName || undefined,
    };

    db.galleryItems.push(newItem);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'GALLERY_ITEM_ADDED',
      `Added gallery item: ${newItem.title} (${newItem.category})`
    );

    res.status(201).json({ success: true, data: newItem });
  }
);

apiRouter.put(
  '/gallery/:id',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const item = db.galleryItems.find((g) => g.id === id);

    if (!item) {
      res.status(404).json({ success: false, error: { message: 'Gallery item not found.' } });
      return;
    }

    const { data, error } = pickFields(req.body, {
      title: 'string',
      category: 'string',
      description: 'string',
      beforeImageUrl: 'string',
      afterImageUrl: 'string',
      singleImageUrl: 'string',
      isBeforeAfter: 'boolean',
      sortOrder: 'number',
      doctorName: 'string',
    });
    if (error) {
      sendBadRequest(res, error);
      return;
    }

    Object.assign(item, data);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'GALLERY_ITEM_UPDATED',
      `Updated gallery item: ${item.title}`
    );

    res.json({ success: true, data: item });
  }
);

apiRouter.delete(
  '/gallery/:id',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const index = db.galleryItems.findIndex((g) => g.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, error: { message: 'Gallery item not found.' } });
      return;
    }

    const removed = db.galleryItems.splice(index, 1)[0];
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'GALLERY_ITEM_DELETED',
      `Deleted gallery item: ${removed.title}`
    );

    res.json({ success: true, message: 'Gallery item deleted.' });
  }
);

// ==========================================
// 7. BLOG & DENTAL TIPS CMS (Super Admin & Doctors)
// ==========================================

apiRouter.get('/blog', (req: Request, res: Response) => {
  const { all } = req.query;
  const db = loadDatabase();
  const posts = all === 'true' ? db.blogPosts : db.blogPosts.filter((p) => p.isPublished);
  res.json({ success: true, data: posts });
});

apiRouter.get('/blog/:slug', (req: Request, res: Response) => {
  const db = loadDatabase();
  const post = db.blogPosts.find((p) => p.slug === req.params.slug || p.id === req.params.slug);
  if (!post) {
    res.status(404).json({ success: false, error: { message: 'Article not found.' } });
    return;
  }
  res.json({ success: true, data: post });
});

apiRouter.post(
  '/blog',
  authenticate,
  authorize(['super_admin', 'doctor', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { title, category, excerpt, content, coverImageUrl, readTimeMinutes } = req.body;

    const invalidField = firstNonStringField({ title, category, excerpt, content, coverImageUrl });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }

    if (!title || !content) {
      res.status(400).json({
        success: false,
        error: { message: 'Title and content are required.' },
      });
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const db = loadDatabase();
    const newPost: BlogPost = {
      id: `b-${Date.now()}`,
      slug,
      title: title.trim(),
      category: category || 'Dental Health Tips',
      readTimeMinutes: Number(readTimeMinutes) || 4,
      excerpt: excerpt || title.substring(0, 140),
      content,
      coverImageUrl: coverImageUrl || '/src/assets/images/viora_smile_consultation_1791308064299.jpg',
      authorName: req.user!.fullName,
      authorRole: req.user!.role === 'doctor' ? 'Clinical Dental Doctor' : 'Viora Dental Editorial',
      authorId: req.user!.userId,
      publishedAt: getClinicToday(),
      isPublished: true,
    };

    db.blogPosts.unshift(newPost);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'BLOG_POST_CREATED',
      `Published dental tip article: "${newPost.title}"`
    );

    res.status(201).json({ success: true, data: newPost });
  }
);

apiRouter.put(
  '/blog/:id',
  authenticate,
  authorize(['super_admin', 'doctor', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const post = db.blogPosts.find((b) => b.id === id);

    if (!post) {
      res.status(404).json({ success: false, error: { message: 'Article not found.' } });
      return;
    }

    if (req.user!.role === 'doctor' && post.authorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { message: 'Doctors can only edit their own articles.' } });
      return;
    }

    // Author, slug, and publish date stay server-controlled
    const { data, error } = pickFields(req.body, {
      title: 'string',
      category: 'string',
      readTimeMinutes: 'number',
      excerpt: 'string',
      content: 'string',
      coverImageUrl: 'string',
      isPublished: 'boolean',
    });
    if (error) {
      sendBadRequest(res, error);
      return;
    }

    Object.assign(post, data);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'BLOG_POST_UPDATED',
      `Updated article: "${post.title}"`
    );

    res.json({ success: true, data: post });
  }
);

apiRouter.delete(
  '/blog/:id',
  authenticate,
  authorize(['super_admin', 'doctor', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const index = db.blogPosts.findIndex((b) => b.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, error: { message: 'Article not found.' } });
      return;
    }

    if (req.user!.role === 'doctor' && db.blogPosts[index].authorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { message: 'Doctors can only delete their own articles.' } });
      return;
    }

    const removed = db.blogPosts.splice(index, 1)[0];
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'BLOG_POST_DELETED',
      `Deleted article: "${removed.title}"`
    );

    res.json({ success: true, message: 'Article removed.' });
  }
);

// ==========================================
// 8. TESTIMONIALS CMS
// ==========================================

apiRouter.get('/testimonials', (req: Request, res: Response) => {
  const { all } = req.query;
  const db = loadDatabase();
  const list = all === 'true' ? db.testimonials : db.testimonials.filter((t) => t.isApproved);
  res.json({ success: true, data: list });
});

// Staff-only: there is no public testimonial form, and entries are published immediately
apiRouter.post(
  '/testimonials',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { patientName, treatment, rating, comment } = req.body;

    const invalidField = firstNonStringField({ patientName, treatment, comment });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }

    if (!patientName || !comment) {
      res.status(400).json({ success: false, error: { message: 'Patient name and review are required.' } });
      return;
    }

    const db = loadDatabase();
    const newT: Testimonial = {
      id: `t-${Date.now()}`,
      patientName: patientName.trim(),
      treatment: treatment || 'Comprehensive Care',
      rating: rating === undefined ? 5 : clampRating(rating),
      comment: comment.trim(),
      date: getClinicToday(),
      isApproved: true,
    };

    db.testimonials.unshift(newT);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'TESTIMONIAL_CREATED',
      `Added testimonial from ${newT.patientName}`
    );

    res.status(201).json({ success: true, data: newT });
  }
);

apiRouter.put(
  '/testimonials/:id',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const item = db.testimonials.find((t) => t.id === id);

    if (!item) {
      res.status(404).json({ success: false, error: { message: 'Testimonial not found.' } });
      return;
    }

    const { data, error } = pickFields(req.body, {
      patientName: 'string',
      treatment: 'string',
      rating: 'number',
      comment: 'string',
      isApproved: 'boolean',
      avatarUrl: 'string',
    });
    if (error) {
      sendBadRequest(res, error);
      return;
    }
    if (data.rating !== undefined) data.rating = clampRating(data.rating);

    Object.assign(item, data);
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'TESTIMONIAL_UPDATED',
      `Updated testimonial from ${item.patientName}`
    );

    res.json({ success: true, data: item });
  }
);

apiRouter.delete(
  '/testimonials/:id',
  authenticate,
  authorize(['super_admin', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const index = db.testimonials.findIndex((t) => t.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, error: { message: 'Testimonial not found.' } });
      return;
    }

    const removed = db.testimonials.splice(index, 1)[0];
    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'TESTIMONIAL_DELETED',
      `Removed testimonial from ${removed.patientName}`
    );

    res.json({ success: true, message: 'Testimonial deleted.' });
  }
);

// ==========================================
// 9. CONTACT MESSAGES
// ==========================================

apiRouter.post('/contact', (req: Request, res: Response) => {
  const { name, firstName, lastName, phone, email, subject, message } = req.body;

  const invalidField = firstNonStringField({ name, firstName, lastName, phone, email, subject, message });
  if (invalidField) {
    sendBadRequest(res, `Field '${invalidField}' must be text.`);
    return;
  }

  const resolvedName =
    name?.trim() ||
    `${firstName || ''} ${lastName || ''}`.trim();

  if (!resolvedName || !phone || !message) {
    res.status(400).json({
      success: false,
      error: { message: 'First name, last name (or full name), phone number, and message are required.' },
    });
    return;
  }

  const db = loadDatabase();
  const newMsg: ContactMessage = {
    id: `m-${Date.now()}`,
    name: resolvedName,
    firstName: firstName ? firstName.trim() : undefined,
    lastName: lastName ? lastName.trim() : undefined,
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    subject: subject ? subject.trim() : 'Patient Inquiry',
    message: message.trim(),
    status: 'unread',
    createdAt: new Date().toISOString(),
  };

  db.contactMessages.unshift(newMsg);
  saveDatabase();

  res.status(201).json({
    success: true,
    data: newMsg,
    message: 'Message delivered to Viora Dental clinic front desk.',
  });
});

apiRouter.get(
  '/contact',
  authenticate,
  authorize(['super_admin', 'receptionist', 'doctor_manager']),
  (_req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    res.json({ success: true, data: db.contactMessages });
  }
);

apiRouter.put(
  '/contact/:id/status',
  authenticate,
  authorize(['super_admin', 'receptionist', 'doctor_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['unread', 'read', 'replied'].includes(status)) {
      sendBadRequest(res, 'Invalid message status.');
      return;
    }

    const db = loadDatabase();
    const msg = db.contactMessages.find((m) => m.id === id);

    if (!msg) {
      res.status(404).json({ success: false, error: { message: 'Message not found.' } });
      return;
    }

    msg.status = status;
    saveDatabase();
    res.json({ success: true, data: msg });
  }
);

apiRouter.delete(
  '/contact/:id',
  authenticate,
  authorize(['super_admin', 'receptionist']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const index = db.contactMessages.findIndex((m) => m.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, error: { message: 'Message not found.' } });
      return;
    }

    db.contactMessages.splice(index, 1);
    saveDatabase();
    res.json({ success: true, message: 'Message removed.' });
  }
);

// ==========================================
// IMAGE UPLOAD (Local computer upload via Base64/DataURL)
// ==========================================

apiRouter.post('/upload', (req: Request, res: Response) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl) {
    res.status(400).json({ success: false, error: { message: 'Image data URL is required.' } });
    return;
  }
  res.json({
    success: true,
    data: {
      url: dataUrl,
      filename: filename || 'uploaded_image.jpg',
    },
  });
});

// ==========================================
// 10. DASHBOARD STATS & SERVED PATIENT ANALYTICS
// ==========================================

apiRouter.get(
  '/dashboard/stats',
  authenticate,
  authorize(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    const todayStr = getClinicToday();

    const todayAppointments = db.appointments.filter((a) => a.date === todayStr);
    const confirmedCount = db.appointments.filter((a) => a.status === 'confirmed').length;
    const pendingCount = db.appointments.filter((a) => a.status === 'pending').length;
    const completedCount = db.appointments.filter((a) => a.status === 'completed').length;

    // Service popular breakdown
    const serviceCounts: Record<string, number> = {};
    for (const apt of db.appointments) {
      serviceCounts[apt.serviceName] = (serviceCounts[apt.serviceName] || 0) + 1;
    }

    const popularServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Historical clinic baseline + all completed & confirmed appointments
    const historicalBaseline = 3248;
    const totalCustomersServed = historicalBaseline + completedCount + confirmedCount;
    const todayCustomersServed = todayAppointments.filter((a) => a.status === 'completed' || a.status === 'confirmed').length;

    // Payment methods breakdown & revenue calculations
    const paymentMethods: Record<string, { count: number; totalETB: number }> = {
      telebirr: { count: 184, totalETB: 1240000 },
      cbe_birr: { count: 142, totalETB: 980000 },
      cash: { count: 96, totalETB: 640000 },
      bank_transfer: { count: 68, totalETB: 850000 },
    };

    let totalRevenueETB = 3710000;
    for (const apt of db.appointments) {
      if (apt.status === 'cancelled') continue;
      const srv = db.services.find((s) => s.id === apt.serviceId);
      const fee = srv ? srv.startingPrice : 1500;
      totalRevenueETB += fee;
      const m = apt.paymentMethod || 'cash';
      if (!paymentMethods[m]) {
        paymentMethods[m] = { count: 0, totalETB: 0 };
      }
      paymentMethods[m].count += 1;
      paymentMethods[m].totalETB += fee;
    }

    // Monthly served trends (for Area/Bar Charts)
    const monthlyServedTrend = [
      { month: 'May', served: 482, revenue: 640000, newPatients: 142, satisfaction: 99.1 },
      { month: 'Jun', served: 516, revenue: 710000, newPatients: 168, satisfaction: 99.3 },
      { month: 'Jul', served: 549, revenue: 780000, newPatients: 185, satisfaction: 99.4 },
      { month: 'Aug', served: 580, revenue: 840000, newPatients: 210, satisfaction: 99.2 },
      { month: 'Sep', served: 612, revenue: 910000, newPatients: 224, satisfaction: 99.5 },
      { month: 'Oct', served: 648 + completedCount, revenue: 1040000 + (totalRevenueETB % 500000), newPatients: 245, satisfaction: 99.6 },
    ];

    // Treatment Category Distribution
    const treatmentCategories = [
      { category: 'Cosmetic & Veneers', count: 42, color: '#0ea5e9', revenue: 1420000 },
      { category: 'General Exams & Cleaning', count: 68, color: '#10b981', revenue: 460000 },
      { category: 'Clear Aligners & Ortho', count: 28, color: '#8b5cf6', revenue: 1260000 },
      { category: 'Dental Implants', count: 19, color: '#f59e0b', revenue: 608000 },
      { category: 'Root Canal Therapy', count: 24, color: '#ec4899', revenue: 156000 },
      { category: 'Pediatric Care', count: 31, color: '#06b6d4', revenue: 94000 },
    ];

    // Doctor Caseload Leaderboard
    const doctorCaseload = db.dentists.map((doc, idx) => {
      const docApts = db.appointments.filter((a) => a.dentistId === doc.id);
      const baselinePatients = [842, 694, 612, 534][idx % 4] || 450;
      return {
        doctorId: doc.id,
        doctorName: doc.name,
        specialization: doc.specialization,
        patientsServed: baselinePatients + docApts.length,
        todayVisits: todayAppointments.filter((a) => a.dentistId === doc.id).length,
        rating: 4.9 + (idx % 2 === 0 ? 0.05 : 0),
        experienceYears: doc.experienceYears,
      };
    });

    res.json({
      success: true,
      data: {
        totalDoctors: db.dentists.filter((d) => d.isActive).length,
        totalGalleryUploads: db.galleryItems.length,
        activeAdminUsers: db.users.filter((u) => u.isActive).length,
        todayAppointmentsCount: todayAppointments.length,
        totalAppointmentsCount: db.appointments.length,
        confirmedCount,
        pendingCount,
        completedCount,
        popularServices,
        unreadMessagesCount: db.contactMessages.filter((m) => m.status === 'unread').length,
        // New served metrics & chart data
        totalCustomersServed,
        todayCustomersServed,
        monthCustomersServed: 648 + completedCount,
        totalRevenueETB,
        paymentMethods,
        monthlyServedTrend,
        treatmentCategories,
        doctorCaseload,
        patientSatisfactionRate: 99.6,
        // Revenue, trends, baselines, ratings, and payment mixes above include illustrative sample figures
        isDemoData: true,
      },
    });
  }
);

// ==========================================
// 11. AUDIT LOGS (Super Admin only)
// ==========================================

apiRouter.get(
  '/audit-logs',
  authenticate,
  authorize(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const db = loadDatabase();
    res.json({
      success: true,
      data: db.auditLogs.slice(0, 100),
    });
  }
);

// ==========================================
// 12. SEO & METADATA SETTINGS
// ==========================================

apiRouter.get('/seo', (_req: Request, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.seoSettings });
});

apiRouter.put(
  '/seo/:page',
  authenticate,
  authorize(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { page } = req.params;
    const { title, metaDescription, ogTitle, ogDescription, keywords } = req.body;

    const invalidField = firstNonStringField({ title, metaDescription, ogTitle, ogDescription, keywords });
    if (invalidField) {
      sendBadRequest(res, `Field '${invalidField}' must be text.`);
      return;
    }

    const db = loadDatabase();
    db.seoSettings[page] = {
      page,
      title: title || '',
      metaDescription: metaDescription || '',
      ogTitle: ogTitle || '',
      ogDescription: ogDescription || '',
      keywords: keywords || '',
    };

    saveDatabase();

    logAudit(
      req.user!.userId,
      req.user!.username,
      req.user!.role,
      'SEO_SETTINGS_UPDATED',
      `Updated meta tags and SEO for page '${page}'`
    );

    res.json({ success: true, data: db.seoSettings[page] });
  }
);
