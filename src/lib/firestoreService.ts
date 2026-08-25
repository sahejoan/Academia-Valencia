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
  RolePermissionsMap
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLASSROOMS,
  INITIAL_COURSES,
  INITIAL_ENROLLMENTS,
  INITIAL_GRADES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITIES,
  INITIAL_ROLE_PERMISSIONS
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
 * Seed initial data if collections in Firestore are empty
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (usersSnap.empty) {
      console.log('🌱 Seeding initial data to Firestore...');

      // Seed Users
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, USERS_COL, u.id), u);
      }

      // Seed Classrooms
      for (const c of INITIAL_CLASSROOMS) {
        await setDoc(doc(db, CLASSROOMS_COL, c.id), c);
      }

      // Seed Courses (in batches of 20 to avoid payload limits)
      for (const course of INITIAL_COURSES) {
        await setDoc(doc(db, COURSES_COL, course.id), course);
      }

      // Seed Enrollments
      for (const e of INITIAL_ENROLLMENTS) {
        await setDoc(doc(db, ENROLLMENTS_COL, e.id), e);
      }

      // Seed Grades
      for (const g of INITIAL_GRADES) {
        await setDoc(doc(db, GRADES_COL, g.id), g);
      }

      // Seed Notifications
      for (const n of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, NOTIFICATIONS_COL, n.id), n);
      }

      // Seed Activities
      for (const a of INITIAL_ACTIVITIES) {
        await setDoc(doc(db, ACTIVITIES_COL, a.id), a);
      }

      // Seed Permissions
      await setDoc(doc(db, SETTINGS_COL, 'role_permissions'), INITIAL_ROLE_PERMISSIONS);

      console.log('✅ Firestore initial seeding completed successfully!');
    }
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

// -------------------------------------------------------------
// Direct Firestore Mutations
// -------------------------------------------------------------

export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    await setDoc(doc(db, USERS_COL, user.id), user, { merge: true });
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
    await setDoc(doc(db, COURSES_COL, course.id), course, { merge: true });
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
    await setDoc(doc(db, CLASSROOMS_COL, classroom.id), classroom, { merge: true });
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
    await setDoc(doc(db, ENROLLMENTS_COL, enrollment.id), enrollment, { merge: true });
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
    await setDoc(doc(db, GRADES_COL, grade.id), grade, { merge: true });
  } catch (e) {
    console.error('Error saving grade to Firestore:', e);
  }
}

export async function syncNotificationToFirestore(notification: NotificationItem): Promise<void> {
  try {
    await setDoc(doc(db, NOTIFICATIONS_COL, notification.id), notification, { merge: true });
  } catch (e) {
    console.error('Error saving notification to Firestore:', e);
  }
}

export async function syncActivityToFirestore(activity: AcademicActivity): Promise<void> {
  try {
    await setDoc(doc(db, ACTIVITIES_COL, activity.id), activity, { merge: true });
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
    await setDoc(doc(db, SETTINGS_COL, 'role_permissions'), permissions, { merge: true });
  } catch (e) {
    console.error('Error saving permissions to Firestore:', e);
  }
}
