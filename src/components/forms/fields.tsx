"use client";

/** Shared accessible form primitives used across auth, booking and portals. */
import { useFormStatus } from "react-dom";
import { useId } from "react";

export function TextField(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  helpText?: string;
  error?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  placeholder?: string;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [props.helpText ? helpId : null, props.error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={`field-block${props.error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {props.label}
        {props.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={id}
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        autoComplete={props.autoComplete}
        defaultValue={props.defaultValue}
        aria-describedby={describedBy}
        aria-invalid={props.error ? true : undefined}
        minLength={props.minLength}
        maxLength={props.maxLength}
        pattern={props.pattern}
        inputMode={props.inputMode}
        placeholder={props.placeholder}
      />
      {props.helpText ? (
        <small id={helpId} className="field-help">
          {props.helpText}
        </small>
      ) : null}
      {props.error ? (
        <p id={errorId} className="field-error" role="alert">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

export function TextAreaField(props: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  helpText?: string;
  error?: string;
  maxLength?: number;
  defaultValue?: string;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [props.helpText ? helpId : null, props.error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={`field-block${props.error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {props.label}
        {props.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <textarea
        id={id}
        name={props.name}
        required={props.required}
        rows={props.rows ?? 4}
        aria-describedby={describedBy}
        aria-invalid={props.error ? true : undefined}
        maxLength={props.maxLength}
        defaultValue={props.defaultValue}
      />
      {props.helpText ? (
        <small id={helpId} className="field-help">
          {props.helpText}
        </small>
      ) : null}
      {props.error ? (
        <p id={errorId} className="field-error" role="alert">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField(props: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={`field-block${props.error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {props.label}
        {props.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <select
        id={id}
        name={props.name}
        required={props.required}
        defaultValue={props.defaultValue ?? ""}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={props.error ? errorId : undefined}
      >
        <option value="" disabled>
          Please choose…
        </option>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {props.error ? (
        <p id={errorId} className="field-error" role="alert">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckboxField(props: {
  label: React.ReactNode;
  name: string;
  required?: boolean;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={`field-block checkbox-block${props.error ? " has-error" : ""}`}>
      <label htmlFor={id} className="checkbox-label">
        <input
          id={id}
          name={props.name}
          type="checkbox"
          required={props.required}
          aria-invalid={props.error ? true : undefined}
          aria-describedby={props.error ? errorId : undefined}
        />
        <span>{props.label}</span>
      </label>
      {props.error ? (
        <p id={errorId} className="field-error" role="alert">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton(props: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={props.className ?? "button"}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true"></span> Please wait…
        </>
      ) : (
        props.children
      )}
    </button>
  );
}
