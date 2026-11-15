import { useState, useRef } from 'react';

export default function useForm({ initialValues = {}, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const setFieldValue = (name, value) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (validate) setErrors(validate(next));
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFieldValue(name, type === 'checkbox' ? checked : value);
  };

  const handleBlur = (e) => {
    const fieldName = e.target.name;
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    if (validate) setErrors(validate(values));
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (isSubmittingRef.current) return;

    const allTouched = Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0 && onSubmit) {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = (newValues = initialValues) => {
    if (isSubmittingRef.current) return;
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, resetForm, setFieldValue };
}
