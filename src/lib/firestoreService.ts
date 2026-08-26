import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  User,
  Course,
  Classroom,
  Enrollment,
  GradeItem,
  NotificationItem,
  AcademicActivity,
  RolePermissionsMap,
  InstitutionalAuthoritySettings
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLASSROOMS,
  INITIAL_COURSES,
  INITIAL_ENROLLMENTS,
  INITIAL_GRADES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITIES,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_AUTHORITY_SETTINGS
} from '../data/initialData';

// Collection references
const USERS_COL = 'users';
const COURSES_COL = 'courses';
const CLASSROOMS_COL = 'classrooms';
const ENROLLMENTS_COL = 'enrollments';
const GRADES_COL = 'grades';
const NOTIFICATIONS_COL = 'notifications';
const ACTIVITIES_COL = 'activities';
const SETTINGS_COL = 'settings';

/**
 * Recursively strips undefined values so Firestore setDoc / updateDoc never throws
 * "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

/**
 * Seed initial data if collections in Firestore are empty
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    // 1. Check and seed Users
    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (usersSnap.empty) {
      console.log('🌱 Seeding initial users to Firestore...');
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, USERS_COL, u.id), sanitizeForFirestore(u));
      }
    } else {
      // Ensure essential initial users (e.g. admin) exist
      const existingUserIds = new Set(usersSnap.docs.map(d => d.id));
      for (const u of INITIAL_USERS) {
        if (!existingUserIds.has(u.id)) {
          await setDoc(doc(db, USERS_COL, u.id), sanitizeForFirestore(u));
        }
      }
    }

    // 2. Check and seed Classrooms
    const classroomsSnap = await getDocs(collection(db, CLASSROOMS_COL));
    if (classroomsSnap.empty) {
      console.log('🌱 Seeding initial classrooms to Firestore...');
      for (const c of INITIAL_CLASSROOMS) {
        await setDoc(doc(db, CLASSROOMS_COL, c.id), sanitizeForFirestore(c));
      }
    }

    // 3. Check and seed Courses (ensure all 47 courses exist)
    const coursesSnap = await getDocs(collection(db, COURSES_COL));
    if (coursesSnap.size < INITIAL_COURSES.length) {
      console.log('🌱 Seeding complete course catalog (47 courses) to Firestore...');
      const existingCourseIds = new Set(coursesSnap.docs.map(d => d.id));
      for (const course of INITIAL_COURSES) {
        if (!existingCourseIds.has(course.id)) {
          await setDoc(doc(db, COURSES_COL, course.id), sanitizeForFirestore(course));
        }
      }
    }

    // 4. Check and seed Enrollments
    const enrollmentsSnap = await getDocs(collection(db, ENROLLMENTS_COL));
    if (enrollmentsSnap.empty && INITIAL_ENROLLMENTS.length > 0) {
      for (const e of INITIAL_ENROLLMENTS) {
        await setDoc(doc(db, ENROLLMENTS_COL, e.id), sanitizeForFirestore(e));
      }
    }

    // 5. Check and seed Grades
    const gradesSnap = await getDocs(collection(db, GRADES_COL));
    if (gradesSnap.empty && INITIAL_GRADES.length > 0) {
      for (const g of INITIAL_GRADES) {
        await setDoc(doc(db, GRADES_COL, g.id), sanitizeForFirestore(g));
      }
    }

    // 6. Check and seed Notifications
    const notifsSnap = await getDocs(collection(db, NOTIFICATIONS_COL));
    if (notifsSnap.empty && INITIAL_NOTIFICATIONS.length > 0) {
      for (const n of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, NOTIFICATIONS_COL, n.id), sanitizeForFirestore(n));
      }
    }

    // 7. Check and seed Activities
    const activitiesSnap = await getDocs(collection(db, ACTIVITIES_COL));
    if (activitiesSnap.empty && INITIAL_ACTIVITIES.length > 0) {
      for (const a of INITIAL_ACTIVITIES) {
        await setDoc(doc(db, ACTIVITIES_COL, a.id), sanitizeForFirestore(a));
      }
    }

    // 8. Check and seed Permissions
    const permSnap = await getDocs(collection(db, SETTINGS_COL));
    if (permSnap.empty) {
      await setDoc(doc(db, SETTINGS_COL, 'role_permissions'), sanitizeForFirestore(INITIAL_ROLE_PERMISSIONS));
      await setDoc(doc(db, SETTINGS_COL, 'institutional_authority'), sanitizeForFirestore(INITIAL_AUTHORITY_SETTINGS));
    } else {
      // Check specifically if institutional_authority exists
      const hasAuthSettings = permSnap.docs.some(d => d.id === 'institutional_authority');
      if (!hasAuthSettings) {
        await setDoc(doc(db, SETTINGS_COL, 'institutional_authority'), sanitizeForFirestore(INITIAL_AUTHORITY_SETTINGS));
      }
    }

    console.log('✅ Firestore initial data check and sync completed successfully!');
  } catch (error) {
    console.error('Error seeding initial Firestore data:', error);
  }
}

// -------------------------------------------------------------
// Real-time Listeners with local synchronization
// -------------------------------------------------------------

export function subscribeToUsers(callback: (users: User[]) => void) {
  return onSnapshot(collection(db, USERS_COL), snapshot => {
    const data: User[] = [];
    snapshot.forEach(doc => data.push(doc.data() as User));
    if (data.length > 0) {
      callback(data);
    }
  }, error => {
    console.warn('Firestore users subscription fallback:', error);
  });
}

export function subscribeToCourses(callback: (courses: Course[]) => void) {
  return onSnapshot(collection(db, COURSES_COL), snapshot => {
    const data: Course[] = [];
    snapshot.forEach(doc => data.push(doc.data() as Course));
    if (data.length > 0) {
      callback(data);
    }
  }, error => {
    console.warn('Firestore courses subscription fallback:', error);
  });
}

export function subscribeToClassrooms(callback: (classrooms: Classroom[]) => void) {
  return onSnapshot(collection(db, CLASSROOMS_COL), snapshot => {
    const data: Classroom[] = [];
    snapshot.forEach(doc => data.push(doc.data() as Classroom));
    if (data.length > 0) {
      callback(data);
    }
  }, error => {
    console.warn('Firestore classrooms subscription fallback:', error);
  });
}

export function subscribeToEnrollments(callback: (enrollments: Enrollment[]) => void) {
  return onSnapshot(collection(db, ENROLLMENTS_COL), snapshot => {
    const data: Enrollment[] = [];
    snapshot.forEach(doc => data.push(doc.data() as Enrollment));
    callback(data);
  }, error => {
    console.warn('Firestore enrollments subscription fallback:', error);
  });
}

export function subscribeToGrades(callback: (grades: GradeItem[]) => void) {
  return onSnapshot(collection(db, GRADES_COL), snapshot => {
    const data: GradeItem[] = [];
    snapshot.forEach(doc => data.push(doc.data() as GradeItem));
    callback(data);
  }, error => {
    console.warn('Firestore grades subscription fallback:', error);
  });
}

export function subscribeToActivities(callback: (activities: AcademicActivity[]) => void) {
  return onSnapshot(collection(db, ACTIVITIES_COL), snapshot => {
    const data: AcademicActivity[] = [];
    snapshot.forEach(doc => data.push(doc.data() as AcademicActivity));
    if (data.length > 0) {
      callback(data);
    }
  }, error => {
    console.warn('Firestore activities subscription fallback:', error);
  });
}

export function subscribeToNotifications(callback: (notifications: NotificationItem[]) => void) {
  return onSnapshot(collection(db, NOTIFICATIONS_COL), snapshot => {
    const data: NotificationItem[] = [];
    snapshot.forEach(doc => data.push(doc.data() as NotificationItem));
    callback(data);
  }, error => {
    console.warn('Firestore notifications subscription fallback:', error);
  });
}

export function subscribeToAuthoritySettings(callback: (settings: InstitutionalAuthoritySettings) => void) {
  return onSnapshot(doc(db, SETTINGS_COL, 'institutional_authority'), snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.data() as InstitutionalAuthoritySettings);
    }
  }, error => {
    console.warn('Firestore authority settings subscription fallback:', error);
  });
}

// -------------------------------------------------------------
// Direct Firestore Mutations
// -------------------------------------------------------------

export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    const cleanUser = sanitizeForFirestore(user);
    await setDoc(doc(db, USERS_COL, user.id), cleanUser, { merge: true });
    console.log('✅ User successfully saved to Firestore:', user.id, user.name);
  } catch (e) {
    console.error('Error saving user to Firestore:', e);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COL, userId));
  } catch (e) {
    console.error('Error deleting user from Firestore:', e);
  }
}

export async function syncCourseToFirestore(course: Course): Promise<void> {
  try {
    const cleanCourse = sanitizeForFirestore(course);
    await setDoc(doc(db, COURSES_COL, course.id), cleanCourse, { merge: true });
  } catch (e) {
    console.error('Error saving course to Firestore:', e);
  }
}

export async function deleteCourseFromFirestore(courseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COURSES_COL, courseId));
  } catch (e) {
    console.error('Error deleting course from Firestore:', e);
  }
}

export async function syncClassroomToFirestore(classroom: Classroom): Promise<void> {
  try {
    const cleanClassroom = sanitizeForFirestore(classroom);
    await setDoc(doc(db, CLASSROOMS_COL, classroom.id), cleanClassroom, { merge: true });
  } catch (e) {
    console.error('Error saving classroom to Firestore:', e);
  }
}

export async function deleteClassroomFromFirestore(classroomId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CLASSROOMS_COL, classroomId));
  } catch (e) {
    console.error('Error deleting classroom from Firestore:', e);
  }
}

export async function syncEnrollmentToFirestore(enrollment: Enrollment): Promise<void> {
  try {
    const cleanEnrollment = sanitizeForFirestore(enrollment);
    await setDoc(doc(db, ENROLLMENTS_COL, enrollment.id), cleanEnrollment, { merge: true });
  } catch (e) {
    console.error('Error saving enrollment to Firestore:', e);
  }
}

export async function deleteEnrollmentFromFirestore(enrollmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ENROLLMENTS_COL, enrollmentId));
  } catch (e) {
    console.error('Error deleting enrollment from Firestore:', e);
  }
}

export async function syncGradeToFirestore(grade: GradeItem): Promise<void> {
  try {
    const cleanGrade = sanitizeForFirestore(grade);
    await setDoc(doc(db, GRADES_COL, grade.id), cleanGrade, { merge: true });
  } catch (e) {
    console.error('Error saving grade to Firestore:', e);
  }
}

export async function syncNotificationToFirestore(notification: NotificationItem): Promise<void> {
  try {
    const cleanNotification = sanitizeForFirestore(notification);
    await setDoc(doc(db, NOTIFICATIONS_COL, notification.id), cleanNotification, { merge: true });
  } catch (e) {
    console.error('Error saving notification to Firestore:', e);
  }
}

export async function syncActivityToFirestore(activity: AcademicActivity): Promise<void> {
  try {
    const cleanActivity = sanitizeForFirestore(activity);
    await setDoc(doc(db, ACTIVITIES_COL, activity.id), cleanActivity, { merge: true });
  } catch (e) {
    console.error('Error saving activity to Firestore:', e);
  }
}

export async function deleteActivityFromFirestore(activityId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ACTIVITIES_COL, activityId));
  } catch (e) {
    console.error('Error deleting activity from Firestore:', e);
  }
}

export async function syncPermissionsToFirestore(permissions: RolePermissionsMap): Promise<void> {
  try {
    const cleanPermissions = sanitizeForFirestore(permissions);
    await setDoc(doc(db, SETTINGS_COL, 'role_permissions'), cleanPermissions, { merge: true });
  } catch (e) {
    console.error('Error saving permissions to Firestore:', e);
  }
}

export async function syncAuthoritySettingsToFirestore(settings: InstitutionalAuthoritySettings): Promise<void> {
  try {
    const cleanSettings = sanitizeForFirestore(settings);
    await setDoc(doc(db, SETTINGS_COL, 'institutional_authority'), cleanSettings, { merge: true });
    console.log('✅ Institutional authority settings successfully saved to Firestore');
  } catch (e) {
    console.error('Error saving authority settings to Firestore:', e);
  }
}
