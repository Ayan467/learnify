import { createContext, useContext, useState, useCallback } from 'react';
import { courseAPI, enrollmentAPI } from '../utils/api';
import toast from 'react-hot-toast';

const CourseContext = createContext(null);

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await courseAPI.getAll(params);
      setCourses(data.data.courses);
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyEnrollments = useCallback(async () => {
    try {
      const { data } = await enrollmentAPI.getMy();
      setMyEnrollments(data.data.enrollments);
      return data.data.enrollments;
    } catch {}
  }, []);

  const enrollFree = useCallback(async (courseId) => {
    const { data } = await enrollmentAPI.enroll(courseId);
    await fetchMyEnrollments();
    toast.success('Enrolled successfully! 🎉');
    return data.data.enrollment;
  }, [fetchMyEnrollments]);

  const updateProgress = useCallback(async (courseId, lectureId) => {
    const { data } = await enrollmentAPI.updateProgress(courseId, lectureId);
    setMyEnrollments(prev =>
      prev.map(e => e.course?._id === courseId || e.course === courseId
        ? { ...e, ...data.data.enrollment }
        : e
      )
    );
    return data.data.enrollment;
  }, []);

  const downloadCertificate = useCallback(async (courseId, courseName) => {
    const response = await enrollmentAPI.getCertificate(courseId);
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${courseName.replace(/\s+/g, '-')}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success('Certificate downloaded!');
  }, []);

  const isEnrolled = useCallback((courseId) => {
    return myEnrollments.some(e =>
      (e.course?._id || e.course)?.toString() === courseId?.toString()
    );
  }, [myEnrollments]);

  const getEnrollment = useCallback((courseId) => {
    return myEnrollments.find(e =>
      (e.course?._id || e.course)?.toString() === courseId?.toString()
    );
  }, [myEnrollments]);

  return (
    <CourseContext.Provider value={{
      courses, myEnrollments, loading,
      fetchCourses, fetchMyEnrollments,
      enrollFree, updateProgress, downloadCertificate,
      isEnrolled, getEnrollment,
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourse must be used within CourseProvider');
  return ctx;
};
