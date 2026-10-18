'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import ListingPhotoPicker from './ListingPhotoPicker';
import { useRentalProperties } from './RentalStateProvider';
import LandlordPropertiesPanel from './LandlordPropertiesPanel';
import FeaturedHomes from './FeaturedHomes';

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type LeaseSummary = { propertyTitle: string; renter: string; signingDate: string; startDate: string; endDate: string; monthlyRent: string; deposit: string; dueDay: string; notes: string };
type AccountRole = 'tenant' | 'landlord' | 'admin';
type ViewingRecord = { id: string | null; propertyId: string | null; property: string; tenant: string; datetime: string; startTime: string; status: string };

function readStoredAccountRole(): AccountRole {
  if (typeof window === 'undefined') return 'tenant';

  try {
    for (const storage of [window.sessionStorage, window.localStorage]) {
      const profile = JSON.parse(storage.getItem('rentrite-profile') ?? 'null') as { role?: unknown } | null;
      if (profile && typeof profile.role === 'string') {
        const nextRole = profile.role.toLowerCase();
        if (nextRole === 'tenant' || nextRole === 'landlord' || nextRole === 'admin') return nextRole;
      }

      const session = JSON.parse(storage.getItem('rentrite-session') ?? 'null') as { user?: { role?: unknown } } | null;
      const sessionRole = session?.user && typeof session.user === 'object' ? (session.user as { role?: unknown }).role : undefined;
      if (typeof sessionRole === 'string') {
        const nextRole = sessionRole.toLowerCase();
        if (nextRole === 'tenant' || nextRole === 'landlord' || nextRole === 'admin') return nextRole;
      }
    }
  } catch {
    // Ignore malformed local storage values and fall back to the default tenant role.
  }

  return 'tenant';
}

export function notifyAccountRoleChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('rentrite-role-change'));
  }
}

export function useAccountRole() {
  const [role, setRole] = useState<AccountRole>('tenant');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncRole = () => {
      setRole(readStoredAccountRole());
      setReady(true);
    };

    syncRole();
    if (typeof window === 'undefined') return;

    window.addEventListener('rentrite-role-change', syncRole);
    window.addEventListener('storage', syncRole);

    return () => {
      window.removeEventListener('rentrite-role-change', syncRole);
      window.removeEventListener('storage', syncRole);
    };
  }, []);

  return { role, ready };
}

export function RentalAccountForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const isLogin = mode === 'login';
  const [role, setRole] = useState('TENANT');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
    if (!apiBaseUrl) {
      setMessageType('error');
      setMessage(`${isLogin ? 'Sign in' : 'Signup'} is not configured yet. Set NEXT_PUBLIC_RENTAL_API_URL to your API base URL.`);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const payload = isLogin
      ? { email, password }
      : {
          name: String(formData.get('name') ?? '').trim(),
          email,
          phone: String(formData.get('phone') ?? '').trim(),
          password,
          role: role.toLowerCase(),
        };

    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(apiErrorMessage(result, isLogin
          ? 'We could not sign you in. Check your email and password, then try again.'
          : 'We could not create your account. Please check your details and try again.'));
      }

      if (isLogin) {
        const loginResult = result as { user?: unknown; accessToken?: unknown; refreshToken?: unknown } | null;
        if (typeof loginResult?.accessToken !== 'string' || typeof loginResult.refreshToken !== 'string') {
          throw new Error('Sign in succeeded, but the server did not return the expected session tokens.');
        }
        const session = JSON.stringify({ user: loginResult.user, accessToken: loginResult.accessToken, refreshToken: loginResult.refreshToken });
        const rememberMe = formData.get('remember') === 'on';
        const storage = rememberMe ? window.localStorage : window.sessionStorage;
        const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;
        const loginUser = loginResult.user && typeof loginResult.user === 'object' ? loginResult.user as { role?: unknown } : null;
        storage.setItem('rentrite-session', session);
        if (typeof loginUser?.role === 'string') storage.setItem('rentrite-profile', JSON.stringify({ email, role: loginUser.role }));
        otherStorage.removeItem('rentrite-session');
        otherStorage.removeItem('rentrite-profile');
        notifyAccountRoleChanged();
        router.replace('/');
      } else {
        window.sessionStorage.setItem('rentrite-pending-profile', JSON.stringify({ email, role: role.toLowerCase() }));
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error && error.message !== 'Failed to fetch'
        ? error.message
        : `Could not reach the ${isLogin ? 'sign-in' : 'signup'} service. Check your connection and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <form id="rental-account-form" className="form-card rental-account-form" onSubmit={handleSubmit}>
    {!isLogin && <>
      <label>Full name<input required name="name" autoComplete="name" placeholder="Your name" /></label>
      <label>Phone<input required name="phone" type="tel" autoComplete="tel" placeholder="+233" /></label>
      <fieldset className="account-role-picker">
        <legend>Choose your account type</legend>
        <div className="account-role-options">
          <label className={`account-role-option${role === 'TENANT' ? ' is-selected' : ''}`}>
            <input type="radio" name="role" value="TENANT" checked={role === 'TENANT'} onChange={() => setRole('TENANT')} />
            <span className="account-role-option-icon" aria-hidden="true">⌂</span>
            <span className="account-role-option-copy"><b>Tenant</b><small>Find a home and book viewings</small></span>
            <span className="account-role-option-check" aria-hidden="true">✓</span>
          </label>
          <label className={`account-role-option${role === 'LANDLORD' ? ' is-selected' : ''}`}>
            <input type="radio" name="role" value="LANDLORD" checked={role === 'LANDLORD'} onChange={() => setRole('LANDLORD')} />
            <span className="account-role-option-icon" aria-hidden="true">▦</span>
            <span className="account-role-option-copy"><b>Landlord</b><small>List and manage properties</small></span>
            <span className="account-role-option-check" aria-hidden="true">✓</span>
          </label>
        </div>
      </fieldset>
    </>}
    <label>Email address<input required type="email" name="email" autoComplete="email" placeholder="you@example.com" /></label>
    <label>Password<input required type="password" name="password" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={8} placeholder="At least 8 characters" /></label>
    {!isLogin && <p className="rental-info-note">We’ll email you a 6-digit code after you create your account.</p>}
    {message && <p className={`rental-workflow-message${messageType === 'error' ? ' is-error' : ''}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}
    <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? isLogin ? 'Signing in…' : 'Creating account…' : isLogin ? 'Sign in' : 'Create account'} {!isSubmitting && <span aria-hidden="true">↗</span>}</button>
  </form>;
}

export function EmailVerificationForm({ initialEmail = '' }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleResendCode() {
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessageType('error');
      setMessage('Enter a valid email address before requesting a new code.');
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
    if (!apiBaseUrl) {
      setMessageType('error');
      setMessage('Email verification is not configured. Set NEXT_PUBLIC_RENTAL_API_URL to your API base URL.');
      return;
    }

    setIsResending(true);
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(result, 'We could not send a new code. Please try again.'));
      setMessage(apiErrorMessage(result, 'If the account can be verified, a new code is on its way. Check your inbox and spam folder.'));
      setMessageType('success');
      setCode('');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error && error.message !== 'Failed to fetch'
        ? error.message
        : 'Could not reach the verification service. Check your connection and try again.');
    } finally {
      setIsResending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
    if (!apiBaseUrl) {
      setMessageType('error');
      setMessage('Email verification is not configured. Set NEXT_PUBLIC_RENTAL_API_URL to your API base URL.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(apiErrorMessage(result, 'We could not verify that code. Check it and try again.'));
      }

      try {
        const pendingProfile = JSON.parse(window.sessionStorage.getItem('rentrite-pending-profile') ?? 'null') as { email?: unknown; role?: unknown } | null;
        if (typeof pendingProfile?.role === 'string' && typeof pendingProfile.email === 'string' && pendingProfile.email.toLowerCase() === email.trim().toLowerCase()) {
          sessionStorage.setItem('rentrite-profile', JSON.stringify({ email: email.trim(), role: pendingProfile.role }));
        }
        sessionStorage.removeItem('rentrite-pending-profile');
      } catch {
        // Verification itself has succeeded; role display can still be refreshed at the next sign-in.
      }
      notifyAccountRoleChanged();
      router.replace('/');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error && error.message !== 'Failed to fetch'
        ? error.message
        : 'Could not reach the verification service. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return <form className="form-card rental-account-form" onSubmit={handleSubmit}>
    <label>Email address<input required type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
    <label>Verification code<input required name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter the 6-digit code" /></label>
    {message && <p className={`rental-workflow-message${messageType === 'error' ? ' is-error' : ''}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}
    <button className="button button-primary" type="submit" disabled={isSubmitting || isResending}>{isSubmitting ? 'Verifying…' : 'Verify email'} {!isSubmitting && <span aria-hidden="true">↗</span>}</button>
    <p className="verification-resend-prompt">Haven’t received your code? <button className="verification-resend-button" type="button" onClick={handleResendCode} disabled={isResending || isSubmitting}>{isResending ? 'Sending a new code…' : 'Resend code'}</button></p>
  </form>;
}

export function PasswordRecoveryForm() {
  const [step, setStep] = useState<'email' | 'reset' | 'complete'>('email');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const requestedEmail = String(formData.get('email') ?? '').trim();
    const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
    if (!apiBaseUrl) {
      setMessageType('error');
      setMessage('Password recovery is not configured. Set NEXT_PUBLIC_RENTAL_API_URL to your API base URL.');
      return;
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: requestedEmail }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(result, 'We could not send a reset code. Check the email and try again.'));
      setEmail(requestedEmail);
      setStep('reset');
      setMessage('If this email is registered, a password reset code is on its way.');
      setMessageType('success');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error && error.message !== 'Failed to fetch' ? error.message : 'Could not reach the password recovery service. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const token = String(formData.get('code') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');
    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Those passwords do not match. Please check and try again.');
      return;
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
    if (!apiBaseUrl) {
      setMessageType('error');
      setMessage('Password recovery is not configured. Set NEXT_PUBLIC_RENTAL_API_URL to your API base URL.');
      return;
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(result, 'We could not reset your password. Check the code and try again.'));
      setStep('complete');
      setMessage('Your password has been updated. You can now sign in with your new password.');
      setMessageType('success');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error && error.message !== 'Failed to fetch' ? error.message : 'Could not reach the password recovery service. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="password-recovery-flow">
    <div className="recovery-stepper" aria-label="Password recovery progress">
      <span className={step === 'email' ? 'is-current' : 'is-complete'}><i>{step === 'email' ? '1' : '✓'}</i><b>Email</b></span><span className="recovery-step-line" />
      <span className={step === 'reset' ? 'is-current' : step === 'complete' ? 'is-complete' : ''}><i>{step === 'complete' ? '✓' : '2'}</i><b>Reset</b></span>
    </div>
    {step === 'email' && <form className="form-card recovery-form" onSubmit={requestResetCode}>
      <label>Email address<input required type="email" name="email" autoComplete="email" placeholder="you@example.com" /></label>
      <p className="recovery-privacy-note"><span aria-hidden="true">✉</span> We’ll send a secure reset code to the email linked to your account.</p>
      {message && <p className={`rental-workflow-message${messageType === 'error' ? ' is-error' : ''}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending code…' : 'Send reset code'} {!isSubmitting && <span aria-hidden="true">↗</span>}</button>
    </form>}
    {step === 'reset' && <form className="form-card recovery-form" onSubmit={resetPassword}>
      <p className="recovery-delivery-note">Enter the code sent to <b>{email}</b>, then choose a new password.</p>
      <label>Reset code<input required name="code" type="text" autoComplete="one-time-code" placeholder="Paste the code from your email" /></label>
      <label>New password<input required name="password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" /></label>
      <label>Confirm new password<input required name="confirmPassword" type="password" autoComplete="new-password" minLength={8} placeholder="Enter your new password again" /></label>
      {message && <p className={`rental-workflow-message${messageType === 'error' ? ' is-error' : ''}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating password…' : 'Save new password'} {!isSubmitting && <span aria-hidden="true">↗</span>}</button>
      <button className="recovery-back-button" type="button" onClick={() => { setStep('email'); setMessage(''); }}>Use a different email</button>
    </form>}
    {step === 'complete' && <div className="recovery-complete" role="status"><span aria-hidden="true">✓</span><h3>You’re all set</h3><p>{message}</p><Link className="button button-primary" href="/login">Continue to sign in <span aria-hidden="true">↗</span></Link></div>}
  </div>;
}

export function RentalPropertyForm() {
  const [step, setStep] = useState<'photos' | 'details'>('photos');
  const [photos, setPhotos] = useState<File[]>([]);
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');

  async function uploadPhotos() {
    if (!photos.length) {
      setMessageType('error');
      setMessage('Add at least one property photo before continuing.');
      return;
    }
    const accessToken = readViewingAccessToken();
    if (!accessToken) {
      setMessageType('error');
      setMessage('Sign in or create a landlord account to upload property photos.');
      return;
    }
    if (!apiBaseUrl) {
      setMessageType('error');
      setMessage('Property uploads are not configured. Set NEXT_PUBLIC_RENTAL_API_URL to your API base URL.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const uploadData = new FormData();
      photos.forEach((photo) => uploadData.append('images', photo));
      const response = await fetch(`${apiBaseUrl}/images`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
        body: uploadData,
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(result, 'Property photos could not be uploaded. Please try again.'));
      const nextImageKeys = extractImageKeys(result);
      if (!nextImageKeys.length) {
        throw new Error('Photos were received, but the image service did not return image keys. Please try again.');
      }
      setImageKeys(nextImageKeys);
      setMessageType('success');
      setMessage('Photos uploaded. Add the property details to finish your listing.');
      setStep('details');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error && error.message !== 'Failed to fetch'
        ? error.message
        : 'Could not reach the image upload service. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiBaseUrl) {
      setMessageType('error');
      setMessage('Property listings are not configured. Set NEXT_PUBLIC_RENTAL_API_URL to your API base URL.');
      return;
    }
    const accessToken = readViewingAccessToken();
    if (!accessToken) {
      setMessageType('error');
      setMessage('Sign in or create a landlord account to submit this property.');
      return;
    }
    if (!imageKeys.length) {
      setMessageType('error');
      setMessage('Upload the property photos before submitting the listing.');
      setStep('photos');
      return;
    }

    const form = new FormData(event.currentTarget);
    const rent = Number(form.get('rent'));
    const deposit = Number(form.get('deposit'));
    const bedrooms = Number(form.get('bedrooms'));
    const bathroom = Number(form.get('bathrooms'));
    if (![rent, deposit, bedrooms, bathroom].every(Number.isFinite)) {
      setMessageType('error');
      setMessage('Enter valid numbers for rent, deposit, bedrooms, and bathrooms.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          title: String(form.get('title') ?? '').trim(),
          description: String(form.get('description') ?? '').trim(),
          address: String(form.get('address') ?? '').trim(),
          rent,
          deposit,
          bedrooms,
          bathroom,
          amenities: String(form.get('amenities') ?? '').split(/[\n,]/).map((amenity) => amenity.trim()).filter(Boolean),
          imageKeys,
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(result, 'Your property could not be submitted. Please check the details and try again.'));
      setCreatedPropertyId(extractPropertyId(result));
      setCompleted(true);
      setMessageType('success');
      setMessage('Upload successful, waiting for approval.');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error && error.message !== 'Failed to fetch'
        ? error.message
        : 'Could not reach the property service. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (completed) return <div className="form-card listing-form-card rental-property-form" role="status">
    <h2>Property submitted</h2>
    <p className="rental-workflow-message">Upload successful, waiting for approval.</p>
    <div className="property-submitted-actions">{createdPropertyId && <Link className="button button-outline" href={`/property/${encodeURIComponent(createdPropertyId)}`}>View property details <span aria-hidden="true">↗</span></Link>}<Link className="button button-primary" href="/dashboard">Go to your dashboard <span aria-hidden="true">↗</span></Link></div>
  </div>;

  return <form className="form-card listing-form-card rental-property-form" onSubmit={handleSubmit}>
    <div className="listing-wizard-progress" aria-label="Property listing steps">
      <span className={step === 'photos' ? 'is-current' : 'is-complete'}><i>{step === 'photos' ? '1' : '✓'}</i><b>Property photos</b></span><span className="listing-wizard-progress-line" />
      <span className={step === 'details' ? 'is-current' : ''}><i>2</i><b>Property details</b></span>
    </div>
    <h2>{step === 'photos' ? 'Add your property photos' : 'Tell us about your property'}</h2>
    <p>{step === 'photos' ? 'Start with clear photos of the home. You can add up to five and choose which one appears first.' : 'Add the key details renters need to understand your home.'}</p>
    <section className="listing-form-section listing-form-photos" hidden={step !== 'photos'}><ListingPhotoPicker onPhotoFilesChange={setPhotos} /></section>
    <section className="listing-form-section" hidden={step !== 'details'}><div className="listing-form-section-title"><span>2</span><div><h3>Property information</h3><p>Add the details renters need to understand your home.</p></div></div><div className="form-grid">
      <label>Property title<input required name="title" placeholder="e.g. Bright apartment in East Legon" /></label>
      <label>Location<input required name="address" placeholder="Area or neighbourhood" /></label>
      <label>Monthly rent (GH₵)<input required name="rent" type="number" min="1" step="0.01" /></label>
      <label>Security deposit (GH₵)<input required name="deposit" type="number" min="0" step="0.01" /></label>
      <label>Bedrooms<input required name="bedrooms" type="number" min="0" defaultValue="1" /></label>
      <label>Bathrooms<input required name="bathrooms" type="number" min="0" defaultValue="1" /></label>
    </div>
    <label>Description<textarea required name="description" rows={4} /></label>
    <label>Amenities <span className="optional-field-label">Optional</span><textarea name="amenities" rows={3} placeholder="e.g. WiFi, air conditioning, secure parking" /><small className="optional-field-help">Separate amenities with commas or put each on a new line.</small></label>
    </section>
    {message && <p className={`rental-workflow-message${messageType === 'error' ? ' is-error' : ''}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}
    <div className="listing-wizard-actions">
      {step === 'details' && <button className="button button-outline" type="button" disabled={isSubmitting} onClick={() => { setMessage(''); setStep('photos'); }}>← Back to photos</button>}
      {step === 'photos' ? <button className="button button-primary" type="button" onClick={uploadPhotos} disabled={isSubmitting}>{isSubmitting ? 'Uploading photos…' : 'Upload and continue'} {!isSubmitting && <span aria-hidden="true">→</span>}</button> : <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting property…' : 'Submit property'} {!isSubmitting && <span aria-hidden="true">↗</span>}</button>}
    </div>
  </form>;
}
export function RentalPropertyActions({ propertyID, propertyTitle, rent, deposit = 0, mode = 'both' }: { propertyID: string; propertyTitle: string; rent: number; deposit?: number; mode?: 'viewing' | 'application' | 'both' }) {
  return <div className={`rental-detail-actions${mode === 'viewing' ? ' is-booking-container' : ''}`} data-property-id={propertyID} data-rent={rent} data-deposit={deposit}>
    {mode !== 'application' && <RentalViewingBooking propertyID={propertyID} propertyTitle={propertyTitle} rent={rent} />}
    {mode !== 'viewing' && <p className="rental-workflow-message" role="status">Rental applications are not available from the connected API yet.</p>}
  </div>;
}

type ViewingSlot = { start: string; end: string };
type BookedInterval = { start: number; end: number };
type ViewingAvailability = { bookedIntervals: BookedInterval[]; availableIntervals: BookedInterval[] };
const viewingSlots: ViewingSlot[] = [
  { start: '09:00', end: '10:00' },
  { start: '11:00', end: '12:00' },
  { start: '13:00', end: '14:00' },
  { start: '15:00', end: '16:00' },
];

function parseViewingTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const clock = value.match(/(?:T|^)(\d{1,2}):(\d{2})/);
  if (clock) return `${clock[1].padStart(2, '0')}:${clock[2]}`;
  const twelveHourClock = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!twelveHourClock) return null;
  let hour = Number(twelveHourClock[1]) % 12;
  if (twelveHourClock[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${twelveHourClock[2] ?? '00'}`;
}

function viewingRowFields(row: unknown) {
  if (!row || typeof row !== 'object') return { start: parseViewingTime(row), end: null, available: null as boolean | null };
  const value = row as Record<string, unknown>;
  const start = parseViewingTime(value.startTime ?? value.start ?? value.time ?? value.dateTime ?? value.slot);
  const end = parseViewingTime(value.endTime ?? value.end);
  const status = typeof value.status === 'string' ? value.status.toLowerCase() : '';
  const availabilityFlag = typeof value.available === 'boolean' ? value.available : typeof value.isAvailable === 'boolean' ? value.isAvailable : typeof value.isBooked === 'boolean' ? !value.isBooked : null;
  const available = availabilityFlag ?? (status ? ['available', 'open', 'free'].includes(status) : null);
  return { start, end, available };
}

function parseViewingAvailability(result: unknown): ViewingAvailability | null {
  const payload = result && typeof result === 'object' && 'data' in result
    ? (result as { data?: unknown }).data ?? result
    : result;
  if (Array.isArray(payload)) {
    const bookedIntervals = payload.map(viewingRowFields).filter((row) => row.start && row.available === false).map((row) => {
      const start = new Date(`2000-01-01T${row.start}:00`).getTime();
      const end = row.end ? new Date(`2000-01-01T${row.end}:00`).getTime() : start + 60 * 60 * 1000;
      return { start, end };
    });
    return { bookedIntervals, availableIntervals: [] };
  }
  if (!payload || typeof payload !== 'object') return null;

  const body = payload as Record<string, unknown>;
  const availableRows = body.availableSlots ?? body.availableTimes ?? body.available ?? body.slots;
  const bookedRows = body.bookedSlots ?? body.unavailableSlots ?? body.bookings ?? body.viewings;
  if (!Array.isArray(availableRows) && !Array.isArray(bookedRows)) return null;

  const bookedIntervals: BookedInterval[] = [];
  const availableIntervals: BookedInterval[] = [];
  if (Array.isArray(availableRows)) {
    const parsedRows = availableRows.map(viewingRowFields);
    parsedRows.filter((row) => row.start && row.available === false).forEach((row) => {
      const start = new Date(`2000-01-01T${row.start}:00`).getTime();
      const end = row.end ? new Date(`2000-01-01T${row.end}:00`).getTime() : start + 60 * 60 * 1000;
      bookedIntervals.push({ start, end });
    });
    if ('availableSlots' in body || 'availableTimes' in body) {
      parsedRows.filter((row) => row.start && row.available !== false).forEach((row) => {
        const start = new Date(`2000-01-01T${row.start}:00`).getTime();
        const end = row.end ? new Date(`2000-01-01T${row.end}:00`).getTime() : start + 60 * 60 * 1000;
        availableIntervals.push({ start, end });
      });
    }
  }
  if (Array.isArray(bookedRows)) {
    bookedRows.map(viewingRowFields).filter((row) => row.start).forEach((row) => {
      const start = new Date(`2000-01-01T${row.start}:00`).getTime();
      const end = row.end ? new Date(`2000-01-01T${row.end}:00`).getTime() : start + 60 * 60 * 1000;
      bookedIntervals.push({ start, end });
    });
  }
  return { bookedIntervals, availableIntervals };
}

function readViewingAccessToken() {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const session = JSON.parse(storage.getItem('rentrite-session') ?? 'null') as { accessToken?: unknown } | null;
      if (typeof session?.accessToken === 'string') return session.accessToken;
    } catch {
      // Check the other browser store if one has malformed session data.
    }
  }
  return null;
}

function clearViewingSession() {
  try {
    window.sessionStorage.removeItem('rentrite-session');
    window.localStorage.removeItem('rentrite-session');
  } catch {
    // Keep the expired-session message useful even if browser storage is blocked.
  }
}

function apiErrorMessage(result: unknown, fallback: string) {
  const body = result && typeof result === 'object' ? result as Record<string, unknown> : null;
  const apiError = body?.error ?? body?.message ?? body?.detail;
  if (typeof apiError === 'string') return apiError;
  if (Array.isArray(apiError) && apiError.every((item) => typeof item === 'string')) return apiError.join(' ');
  return fallback;
}

function viewingRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const row = value as Record<string, unknown>;
  for (const key of ['data', 'viewings', 'bookings', 'results', 'items', 'result']) {
    if (key in row) return viewingRows(row[key]);
  }
  return [value];
}

function formatViewingDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function viewingRecords(value: unknown): ViewingRecord[] {
  return viewingRows(value).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const property = row.property && typeof row.property === 'object' ? row.property as Record<string, unknown> : null;
    const tenant = row.tenant && typeof row.tenant === 'object' ? row.tenant as Record<string, unknown> : null;
    const startValue = row.startTime ?? row.scheduledAt ?? row.dateTime ?? row.viewingDate ?? row.datetime;
    const startTime = typeof startValue === 'string' ? startValue : '';
    const rawId = row.id ?? row.viewingId ?? row.bookingId;
    const rawPropertyId = row.propertyId ?? property?.id;
    const propertyName = row.propertyTitle ?? row.propertyName ?? property?.title ?? property?.name ?? (typeof row.property === 'string' ? row.property : null);
    const tenantName = row.tenantName ?? row.renterName ?? tenant?.name ?? tenant?.fullName ?? (typeof row.tenant === 'string' ? row.tenant : null);
    return [{
      id: typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : null,
      propertyId: typeof rawPropertyId === 'string' || typeof rawPropertyId === 'number' ? String(rawPropertyId) : null,
      property: typeof propertyName === 'string' && propertyName.trim() ? propertyName : 'Property viewing',
      tenant: typeof tenantName === 'string' ? tenantName : 'Tenant',
      datetime: startTime ? formatViewingDate(startTime) : 'Time not provided',
      startTime,
      status: String(row.status ?? row.bookingStatus ?? 'PENDING').toUpperCase(),
    }];
  });
}

function extractImageKeys(result: unknown): string[] {
  const visit = (value: unknown): string[] => {
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    if (Array.isArray(value)) return value.flatMap(visit);
    if (!value || typeof value !== 'object') return [];
    const row = value as Record<string, unknown>;
    for (const key of ['imageKey', 'key', 'storageKey']) {
      if (typeof row[key] === 'string' && row[key].trim()) return [row[key].trim()];
    }
    for (const key of ['imageKeys', 'keys', 'images', 'data', 'result']) {
      if (key in row) {
        const found = visit(row[key]);
        if (found.length) return found;
      }
    }
    return [];
  };
  return [...new Set(visit(result))];
}

function extractPropertyId(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const row = result as Record<string, unknown>;
  const id = row.id ?? row.propertyId;
  if (typeof id === 'string' || typeof id === 'number') return String(id);
  for (const key of ['data', 'property', 'result']) { const found = extractPropertyId(row[key]); if (found) return found; }
  return null;
}

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSundayDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).getDay() === 0;
}

function nextBookableDate(date: Date) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (next.getDay() === 0) next.setDate(next.getDate() + 1);
  return localDateValue(next);
}

function calendarMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function ViewingDatePicker({ label, value, minDate, maxDate, onChange, disabled = false }: { label: string; value: string; minDate: string; maxDate: string; onChange: (date: string) => void; disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarView, setCalendarView] = useState(() => ({
    key: `${value}|${minDate}`,
    month: (value || minDate).slice(0, 7),
  }));
  const calendarKey = `${value}|${minDate}`;
  const selectedMonth = (value || minDate).slice(0, 7);
  const visibleMonth = calendarView.key === calendarKey ? calendarView.month : selectedMonth;

  const monthStart = calendarMonth(visibleMonth);
  const year = monthStart.getFullYear();
  const monthIndex = monthStart.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingDays = (monthStart.getDay() + 6) % 7;
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const canGoPrevious = visibleMonth > minDate.slice(0, 7);
  const canGoNext = visibleMonth < maxDate.slice(0, 7);
  const selectedDateLabel = value
    ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Choose a date';

  return <div className="viewing-date-picker">
    <span className="viewing-date-picker-label">{label}</span>
    <button type="button" className="viewing-date-picker-trigger" aria-haspopup="dialog" aria-expanded={isOpen} disabled={disabled} onClick={() => setIsOpen((open) => !open)}>
      <span aria-hidden="true">▦</span>{selectedDateLabel}<span className="viewing-date-picker-chevron" aria-hidden="true">⌄</span>
    </button>
    {isOpen && <div className="viewing-date-calendar" role="dialog" aria-label={label}>
      <div className="viewing-date-calendar-header"><button type="button" aria-label="Previous month" disabled={!canGoPrevious} onClick={() => setCalendarView({ key: calendarKey, month: localDateValue(new Date(year, monthIndex - 1, 1)).slice(0, 7) })}>‹</button><strong>{monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><button type="button" aria-label="Next month" disabled={!canGoNext} onClick={() => setCalendarView({ key: calendarKey, month: localDateValue(new Date(year, monthIndex + 1, 1)).slice(0, 7) })}>›</button></div>
      <div className="viewing-date-calendar-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span className={day === 'Sun' ? 'is-sunday' : ''} key={day} aria-hidden="true">{day}</span>)}
        {Array.from({ length: cellCount }, (_, index) => {
          const day = index - leadingDays + 1;
          if (day < 1 || day > daysInMonth) return <span className="is-outside-month" key={`empty-${index}`} aria-hidden="true" />;
          const date = new Date(year, monthIndex, day);
          const dateValue = localDateValue(date);
          const sunday = date.getDay() === 0;
          const outsideRange = dateValue < minDate || dateValue > maxDate;
          const unavailable = sunday || outsideRange;
          return <button type="button" key={dateValue} className={`viewing-date-calendar-day${sunday ? ' is-sunday' : ''}${dateValue === value ? ' is-selected' : ''}${unavailable ? ' is-unavailable' : ''}`} disabled={disabled || unavailable} aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${sunday ? ', unavailable, closed Sundays' : outsideRange ? ', outside booking window' : ''}`} aria-pressed={dateValue === value} onClick={() => { onChange(dateValue); setIsOpen(false); }}>{day}</button>;
        })}
      </div>
      <p className="viewing-date-calendar-note">Sundays are closed. Choose a date within the next 7 days.</p>
    </div>}
  </div>;
}

function formatViewingTime(time: string) {
  const [hourValue, minute] = time.split(':').map(Number);
  const suffix = hourValue >= 12 ? 'PM' : 'AM';
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function isViewingSlotBooked(slot: ViewingSlot, date: string, availability: ViewingAvailability | null) {
  if (!availability) return false;
  const slotStart = new Date(`${date}T${slot.start}:00`).getTime();
  const slotEnd = new Date(`${date}T${slot.end}:00`).getTime();
  const explicitlyAvailable = availability.availableIntervals.length > 0;
  const notAvailableInResponse = explicitlyAvailable && !availability.availableIntervals.some((interval) => slotStart >= interval.start && slotEnd <= interval.end);
  return notAvailableInResponse || availability.bookedIntervals.some((booking) => slotStart < booking.end + 60 * 60 * 1000 && slotEnd + 60 * 60 * 1000 > booking.start);
}

export function RentalViewingBooking({ propertyID, propertyTitle, rent }: { propertyID: string; propertyTitle: string; rent: number }) {
  const router = useRouter();
  const [today] = useState(() => localDateValue(new Date()));
  const [lastBookableDate] = useState(() => {
    const lastBookable = new Date();
    lastBookable.setDate(lastBookable.getDate() + 7);
    return localDateValue(lastBookable);
  });
  const [selectedDate, setSelectedDate] = useState(() => nextBookableDate(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [availability, setAvailability] = useState<ViewingAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');


  useEffect(() => {
    if (!selectedDate) return;
    const refreshAvailability = () => setRefreshKey((current) => current + 1);
    const interval = window.setInterval(refreshAvailability, 30_000);
    window.addEventListener('focus', refreshAvailability);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshAvailability);
    };
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    const controller = new AbortController();
    async function loadAvailability() {
      setIsLoading(true);
      setAvailability(null);
      setError('');
      setNeedsSignIn(false);
      const accessToken = readViewingAccessToken();
      if (!accessToken) {
        setNeedsSignIn(true);
        setError('Sign in to see available viewing times.');
        setIsLoading(false);
        return;
      }
      if (!apiBaseUrl) {
        setError('Viewing availability is not configured.');
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${apiBaseUrl}/properties/${encodeURIComponent(propertyID)}/viewings/availability?date=${encodeURIComponent(selectedDate)}`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const responseMessage = apiErrorMessage(result, 'Could not load available viewing times.');
          if (response.status === 401 || /invalid.*token|expired.*token|token.*expired/i.test(responseMessage)) {
            clearViewingSession();
            setNeedsSignIn(true);
            throw new Error('Your session has expired. Sign in again to load viewing availability.');
          }
          throw new Error(responseMessage);
        }
        const parsed = parseViewingAvailability(result);
        if (!parsed) throw new Error('The viewing service returned an unsupported availability format.');
        setAvailability(parsed);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : 'Could not load available viewing times.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadAvailability();
    return () => controller.abort();
  }, [apiBaseUrl, propertyID, selectedDate, refreshKey]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTime || !apiBaseUrl) return;
    if (selectedDate < today || selectedDate > lastBookableDate || isSundayDate(selectedDate)) {
      setError(isSundayDate(selectedDate) ? 'Viewings are not available on Sundays. Choose another date.' : 'Choose a viewing date within the next seven days.');
      return;
    }
    const accessToken = readViewingAccessToken();
    if (!accessToken) {
      setNeedsSignIn(true);
      setError('Sign in to book a viewing.');
      return;
    }
    const slot = viewingSlots.find((candidate) => candidate.start === selectedTime);
    if (!slot) return;
    if (!availability || isViewingSlotBooked(slot, selectedDate, availability)) {
      setSelectedTime('');
      setError('That time is no longer available. Choose another viewing time.');
      return;
    }

    const startTime = new Date(`${selectedDate}T${slot.start}:00`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/viewings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ propertyId: propertyID, startTime: startTime.toISOString(), endTime: endTime.toISOString() }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const responseMessage = apiErrorMessage(result, 'This viewing time could not be booked. Please choose another slot.');
        if (response.status === 401 || /invalid.*token|expired.*token|token.*expired/i.test(responseMessage)) {
          clearViewingSession();
          setNeedsSignIn(true);
          throw new Error('Your session has expired. Sign in again before booking a viewing.');
        }
        throw new Error(responseMessage);
      }
      const confirmation = new URLSearchParams({
        property: propertyTitle,
        date: selectedDate,
        time: slot.start,
      });
      const readEmailState = (value: unknown): boolean | undefined => {
        if (!value || typeof value !== 'object') return undefined;
        if (Array.isArray(value)) {
          for (const item of value) { const state = readEmailState(item); if (typeof state === 'boolean') return state; }
          return undefined;
        }
        const row = value as Record<string, unknown>;
        for (const key of ['emailSent', 'notificationSent', 'emailDelivered', 'emailNotificationSent']) if (typeof row[key] === 'boolean') return row[key] as boolean;
        for (const key of ['data', 'result', 'booking', 'viewing']) { const state = readEmailState(row[key]); if (typeof state === 'boolean') return state; }
        return undefined;
      };
      let emailState = readEmailState(result);
      const resultMessage = apiErrorMessage(result, '');
      if (typeof emailState !== 'boolean' && /(?:email|notification).*(?:sent|delivered)|(?:sent|delivered).*(?:email|notification)/i.test(resultMessage)) emailState = true;
      if (typeof emailState !== 'boolean' && /(?:email|notification).*(?:failed|could not|not sent)/i.test(resultMessage)) emailState = false;
      if (resultMessage) confirmation.set('notice', resultMessage);
      if (typeof emailState === 'boolean') confirmation.set('email', emailState ? 'sent' : 'pending');
      router.push(`/viewing-confirmation?${confirmation.toString()}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'This viewing time could not be booked. Please try another slot.');
      setRefreshKey((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="rental-detail-actions is-booking-container" data-property-id={propertyID} data-rent={rent}>
    <form className="form-card rental-action-form rental-booking-form" onSubmit={submitBooking}>
      <div className="booking-card-heading"><span className="booking-card-icon" aria-hidden="true">◷</span><span className="booking-card-kicker">SEE IT IN PERSON</span></div>
      <h3>Book a viewing</h3>
      <p>Choose a time that works for you. Viewings run from 9:00 AM to 5:00 PM, with an hour between appointments.</p>
      <div className="booking-date-label"><ViewingDatePicker label="Choose a date" value={selectedDate} minDate={today} maxDate={lastBookableDate} disabled={isSubmitting} onChange={(nextDate) => { setSelectedDate(nextDate); setSelectedTime(''); setMessage(''); setError(''); }} /></div>
      <fieldset className="booking-slot-fieldset" disabled={isSubmitting}>
        <legend>Available times</legend>
        <div className="booking-slot-grid">{viewingSlots.map((slot) => {
          const booked = Boolean(availability && isViewingSlotBooked(slot, selectedDate, availability));
          const label = `${formatViewingTime(slot.start)} – ${formatViewingTime(slot.end)}`;
          const slotState = booked ? 'Booked' : isLoading ? 'Checking' : '1 hour';
          return <button className={`booking-slot${selectedTime === slot.start && !booked ? ' is-selected' : ''}${booked ? ' is-booked' : ''}`} type="button" key={slot.start} disabled={booked || isSubmitting} aria-pressed={selectedTime === slot.start && !booked} aria-label={`${label}${booked ? ', booked' : ', available'}`} onClick={() => { setSelectedTime(slot.start); setMessage(''); }}><strong>{formatViewingTime(slot.start)}</strong><span>{formatViewingTime(slot.end)}</span><small>{slotState}</small></button>;
        })}</div>
      </fieldset>
      {isLoading && <p className="booking-availability-note" role="status">Checking available times…</p>}
      {error && <p className="rental-workflow-message is-error" role="alert">{error}{needsSignIn && <> <Link href="/login">Sign in</Link></>}</p>}
      {message && <p className="rental-workflow-message" role="status">{message}</p>}
      <button className="button button-primary" type="submit" disabled={!selectedTime || !availability || isSubmitting}>{isSubmitting ? 'Booking…' : 'Request a viewing'} {!isSubmitting && <span aria-hidden="true">↗</span>}</button>
      <span className="booking-card-note"><span aria-hidden="true">✓</span> The property team will confirm your visit.</span>
    </form>
  </div>;
}

const initialApplications: { id: string; propertyId: string; property: string; tenantId: string; tenant: string; document: string; status: ApplicationStatus }[] = [];
export function RentalDashboard({ page = 'overview' }: { page?: 'overview' | 'properties' }) {
  const { properties: rentalProperties } = useRentalProperties();
  const { role: accountRole, ready: accountRoleReady } = useAccountRole();
  const [applications, setApplications] = useState(initialApplications);
  const [viewings, setViewings] = useState<ViewingRecord[]>([]);
  const [viewingsLoading, setViewingsLoading] = useState(false);
  const [viewingsError, setViewingsError] = useState('');
  const [viewingActionMessage, setViewingActionMessage] = useState('');
  const [viewingActionError, setViewingActionError] = useState(false);
  const [busyViewingId, setBusyViewingId] = useState<string | null>(null);
  const [reschedulingViewingId, setReschedulingViewingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(() => nextBookableDate(new Date()));
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleAvailability, setRescheduleAvailability] = useState<ViewingAvailability | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');
  const [message, setMessage] = useState('');
  const [leasePropertyId, setLeasePropertyId] = useState('');
  const [leaseSummary, setLeaseSummary] = useState<LeaseSummary | null>(null);
  const [leaseMessage, setLeaseMessage] = useState('');
  const apiBaseUrl = process.env.NEXT_PUBLIC_RENTAL_API_URL?.trim().replace(/\/$/, '');
  const [todayDate] = useState(() => localDateValue(new Date()));
  const [lastBookableDate] = useState(() => {
    const lastBookable = new Date();
    lastBookable.setDate(lastBookable.getDate() + 7);
    return localDateValue(lastBookable);
  });
  const isTenantAccount = accountRoleReady && accountRole === 'tenant';
  const isAdminAccount = accountRoleReady && accountRole === 'admin';
  const isLandlord = accountRoleReady && (accountRole === 'landlord' || isAdminAccount);

  useEffect(() => {
    if (!isTenantAccount) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      async function loadTenantViewings() {
        setViewingsLoading(true);
        setViewingsError('');
        const accessToken = readViewingAccessToken();
        if (!accessToken) {
          setViewings([]);
          setViewingsError('Sign in to see your viewing requests.');
          setViewingsLoading(false);
          return;
        }
        if (!apiBaseUrl) {
          setViewingsError('Viewing history is not configured.');
          setViewingsLoading(false);
          return;
        }
        try {
          const response = await fetch(`${apiBaseUrl}/viewings/me`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
            signal: controller.signal,
          });
          const result: unknown = await response.json().catch(() => null);
          if (!response.ok) {
            if (response.status === 401) clearViewingSession();
            throw new Error(apiErrorMessage(result, `Could not load viewing requests (HTTP ${response.status}).`));
          }
          setViewings(viewingRecords(result));
        } catch (loadError) {
          if (!controller.signal.aborted) setViewingsError(loadError instanceof Error ? loadError.message : 'Could not load viewing requests.');
        } finally {
          if (!controller.signal.aborted) setViewingsLoading(false);
        }
      }
      void loadTenantViewings();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [apiBaseUrl, isTenantAccount]);

  useEffect(() => {
    const viewing = viewings.find((item) => item.id === reschedulingViewingId);
    if (!viewing || !reschedulingViewingId) return;
    const activeViewing = viewing;
    const controller = new AbortController();
    async function loadRescheduleAvailability() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      if (!activeViewing.propertyId) {
        setRescheduleAvailability(null);
        setRescheduleLoading(false);
        setRescheduleError('This viewing is missing its property ID, so available times cannot be checked.');
        return;
      }
      if (rescheduleDate < todayDate || rescheduleDate > lastBookableDate || isSundayDate(rescheduleDate)) {
        setRescheduleAvailability(null);
        setRescheduleLoading(false);
        setRescheduleError(isSundayDate(rescheduleDate) ? 'Viewings are not available on Sundays.' : 'Choose a date within the next seven days.');
        return;
      }
      const propertyId = activeViewing.propertyId;
      setRescheduleLoading(true);
      setRescheduleAvailability(null);
      setRescheduleError('');
      const accessToken = readViewingAccessToken();
      if (!accessToken) {
        setRescheduleError('Sign in again to check available times.');
        setRescheduleLoading(false);
        return;
      }
      if (!apiBaseUrl) {
        setRescheduleError('Viewing availability is not configured.');
        setRescheduleLoading(false);
        return;
      }
      try {
        const response = await fetch(`${apiBaseUrl}/properties/${encodeURIComponent(propertyId)}/viewings/availability?date=${encodeURIComponent(rescheduleDate)}`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          if (response.status === 401) clearViewingSession();
          throw new Error(apiErrorMessage(result, `Could not load available times (HTTP ${response.status}).`));
        }
        const parsed = parseViewingAvailability(result);
        if (!parsed) throw new Error('The viewing service returned an unsupported availability format.');
        setRescheduleAvailability(parsed);
      } catch (loadError) {
        if (!controller.signal.aborted) setRescheduleError(loadError instanceof Error ? loadError.message : 'Could not load available times.');
      } finally {
        if (!controller.signal.aborted) setRescheduleLoading(false);
      }
    }
    void loadRescheduleAvailability();
    return () => controller.abort();
  }, [apiBaseUrl, lastBookableDate, rescheduleDate, reschedulingViewingId, todayDate, viewings]);

  const managedProperties = rentalProperties.filter((property) => property.status === 'For Rent');
  const occupiedProperties = managedProperties.filter((property) => property.occupied);
  const selectedLeaseProperty = occupiedProperties.find((property) => String(property.id) === leasePropertyId) ?? occupiedProperties[0];
  const tenantPreviewId = '';
  const tenantApplications = applications;
  const tenantViewings = viewings;
  const visibleViewings = viewings.map((viewing, index) => ({ viewing, index }));

  function setApplicationStatus(id: string, status: ApplicationStatus) {
    setApplications((current) => current.map((application) => application.id === id ? { ...application, status } : application));
    setMessage(status === 'APPROVED' ? 'Application approved. Lease details can now be prepared.' : 'Application status updated.');
  }



  async function updateTenantViewing(viewing: ViewingRecord, action: 'cancel' | 'reschedule' | 'complete', nextStartTime?: string) {
    if (!viewing.id || !apiBaseUrl) return;
    const accessToken = readViewingAccessToken();
    if (!accessToken) {
      setViewingsError('Sign in again to manage your viewing requests.');
      return;
    }
    if (action === 'reschedule' && !nextStartTime) {
      setViewingActionError(true);
      setViewingActionMessage('Choose an available date and time first.');
      return;
    }

    setBusyViewingId(viewing.id);
    setViewingActionMessage('');
    setViewingActionError(false);
    const path = action === 'cancel'
      ? `/viewings/${encodeURIComponent(viewing.id)}`
      : action === 'reschedule'
        ? `/viewings/${encodeURIComponent(viewing.id)}/reschedule`
        : `/viewings/${encodeURIComponent(viewing.id)}/complete`;
    const init: RequestInit = action === 'cancel'
      ? { method: 'DELETE' }
      : action === 'complete'
        ? { method: 'PATCH' }
      : {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startTime: new Date(nextStartTime as string).toISOString() }),
        };

    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, ...(init.headers ?? {}) },
        cache: 'no-store',
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 401) clearViewingSession();
        throw new Error(apiErrorMessage(result, `Could not ${action === 'cancel' ? 'cancel' : action === 'reschedule' ? 'reschedule' : 'complete'} this viewing (HTTP ${response.status}).`));
      }
      if (action === 'cancel') {
        setViewings((current) => current.filter((item) => item.id !== viewing.id));
        setViewingActionMessage('Viewing cancelled.');
      } else if (action === 'reschedule') {
        const dateTime = nextStartTime as string;
        setViewings((current) => current.map((item) => item.id === viewing.id ? { ...item, startTime: new Date(dateTime).toISOString(), datetime: formatViewingDate(dateTime) } : item));
        setReschedulingViewingId(null);
        setRescheduleTime('');
        setRescheduleAvailability(null);
        setViewingActionMessage('Viewing rescheduled.');
      } else {
        setViewings((current) => current.map((item) => item.id === viewing.id ? { ...item, status: 'COMPLETED' } : item));
        setViewingActionMessage('Viewing marked as completed.');
      }
    } catch (actionError) {
      setViewingActionError(true);
      setViewingActionMessage(actionError instanceof Error ? actionError.message : 'Could not update this viewing.');
    } finally {
      setBusyViewingId(null);
    }
  }

  function prepareLease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLeaseProperty) return;
    const form = new FormData(event.currentTarget);
    const startDate = String(form.get('leaseStart'));
    const endDate = String(form.get('leaseEnd'));
    if (new Date(endDate) <= new Date(startDate)) {
      setLeaseMessage('Choose an end date that falls after the lease start date.');
      setLeaseSummary(null);
      return;
    }
    setLeaseSummary({
      propertyTitle: selectedLeaseProperty.title,
      renter: selectedLeaseProperty.rentedByName ?? 'Confirmed tenant',
      signingDate: String(form.get('signingDate')),
      startDate,
      endDate,
      monthlyRent: String(form.get('monthlyRent')),
      deposit: String(form.get('deposit')),
      dueDay: String(form.get('dueDay')),
      notes: String(form.get('leaseNotes')),
    });
    setLeaseMessage('Lease details are ready to review.');
  }

  return <div className={`rental-workspace${isAdminAccount ? ' admin-dashboard' : isLandlord ? ' landlord-dashboard' : ' tenant-dashboard'}`}>
    <div className="rental-workspace-heading"><div><span className="eyebrow">{page === 'properties' ? 'YOUR LISTINGS' : isAdminAccount && isLandlord ? 'ADMIN OVERVIEW' : isLandlord ? 'LANDLORD OVERVIEW' : 'YOUR TENANT SPACE'}</span><h2>{page === 'properties' ? isAdminAccount ? 'All properties' : 'My properties' : isAdminAccount ? 'Admin operations' : isLandlord ? 'Your rental portfolio' : 'A place to call home'}</h2><p>{page === 'properties' ? isAdminAccount ? 'Review listing status and moderate the full property catalog.' : 'Review and update the properties in your portfolio.' : isAdminAccount ? 'Review submissions, manage listing visibility, and oversee the property catalog.' : isLandlord ? 'A quick view of your portfolio and rental activity.' : 'Browse live landlord listings and request viewings. The connected API does not provide tenant rental or application history.'}</p></div></div>
    {page === 'properties' ? isLandlord ? <section className="rental-workspace-section landlord-listings-section"><LandlordPropertiesPanel isAdmin={isAdminAccount} mode="manage" /></section> : <div className="tenant-empty-home"><div><h4>Property management is for landlords</h4><p>Browse available homes from the property listings page.</p><Link href="/list-layout-new" className="button button-primary">Browse properties ↗</Link></div></div> : isLandlord ? <LandlordPropertiesPanel isAdmin={isAdminAccount} mode="overview" /> : <>
    {!isLandlord && <div className="tenant-overview-stats" aria-label="Tenant activity summary">
      <article><span className="tenant-stat-icon tenant-stat-home" aria-hidden="true">⌂</span><div><small>Rental bookings</small><strong>—</strong><span>Not provided by the connected API</span></div></article>
      <article><span className="tenant-stat-icon tenant-stat-viewing" aria-hidden="true">◷</span><div><small>Viewing history</small><strong>{viewingsLoading ? '…' : tenantViewings.length}</strong><span>{viewingsError || 'Your booked property visits'}</span></div></article>
      <article><span className="tenant-stat-icon tenant-stat-application" aria-hidden="true">▤</span><div><small>Applications</small><strong>—</strong><span>Not provided by the connected API</span></div></article>
    </div>}
    {message && <p className="rental-workflow-message" role="status">{message}</p>}
    <section className={`rental-workspace-section${isLandlord ? '' : ' tenant-record-section'}`}>
      <div className="tenant-section-heading">
        <div><span className="eyebrow">{isLandlord ? 'VIEWING WORKFLOW' : 'YOUR NEXT VISIT'}</span><h3>Viewing requests</h3></div>
        {!isLandlord && <span className="tenant-section-count">{viewingsLoading ? 'Loading…' : viewingsError ? 'Unavailable' : `${tenantViewings.length} ${tenantViewings.length === 1 ? 'request' : 'requests'}`}</span>}
      </div>
      {(viewingActionMessage || viewingActionError || viewingsError) && <p className={`rental-workflow-message${viewingActionError || viewingsError ? ' is-error' : ''}`} role={viewingActionError || viewingsError ? 'alert' : 'status'}>{viewingActionMessage || viewingsError}</p>}
      <div className="rental-record-list">
        {visibleViewings.map(({ viewing }) => {
          const terminalStatus = ['COMPLETED', 'CANCELLED', 'CANCELED', 'DELETED', 'REJECTED'].includes(viewing.status);
          const canManage = isTenantAccount && Boolean(viewing.id) && !terminalStatus;
          return <article className="rental-record" key={viewing.id ?? `${viewing.property}-${viewing.startTime}`}>
            {!isLandlord && <span className="tenant-record-icon" aria-hidden="true">◷</span>}
            <div><b>{viewing.property}</b><span>{isLandlord ? `${viewing.tenant} · ` : ''}{viewing.datetime}</span></div>
            <span className={`rental-status status-${viewing.status.toLowerCase()}`}>{viewing.status}</span>
            {canManage && <div className="rental-record-actions">
              <button type="button" disabled={busyViewingId === viewing.id} onClick={() => void updateTenantViewing(viewing, 'cancel')}>{busyViewingId === viewing.id ? 'Working…' : 'Cancel viewing'}</button>
              <button type="button" disabled={busyViewingId === viewing.id || !viewing.propertyId} title={!viewing.propertyId ? 'Property ID is needed to check available times' : undefined} onClick={() => { setReschedulingViewingId(viewing.id); setRescheduleDate(nextBookableDate(new Date())); setRescheduleTime(''); setRescheduleError(''); }}>Reschedule</button>
              <button type="button" disabled={busyViewingId === viewing.id} onClick={() => void updateTenantViewing(viewing, 'complete')}>Mark completed</button>
            </div>}
            {canManage && reschedulingViewingId === viewing.id && <form className="rental-record-reschedule" onSubmit={(event) => {
              event.preventDefault();
              const slot = viewingSlots.find((candidate) => candidate.start === rescheduleTime);
              if (!slot || !rescheduleAvailability || isViewingSlotBooked(slot, rescheduleDate, rescheduleAvailability)) {
                setRescheduleTime('');
                setRescheduleError('That time is no longer available. Choose another viewing time.');
                return;
              }
              const startTime = new Date(`${rescheduleDate}T${slot.start}:00`);
              void updateTenantViewing(viewing, 'reschedule', startTime.toISOString());
            }}>
              <ViewingDatePicker label="New date" value={rescheduleDate} minDate={todayDate} maxDate={lastBookableDate} disabled={busyViewingId === viewing.id} onChange={(nextDate) => { setRescheduleTime(''); setRescheduleDate(nextDate); setRescheduleError(''); }} />
              <div className="rental-reschedule-slots" role="group" aria-label="Available one hour viewing times">
                {viewingSlots.map((slot) => {
                  const booked = Boolean(rescheduleAvailability && isViewingSlotBooked(slot, rescheduleDate, rescheduleAvailability));
                  return <button key={slot.start} type="button" className={rescheduleTime === slot.start ? 'is-selected' : ''} disabled={busyViewingId === viewing.id || rescheduleLoading || !rescheduleAvailability || booked} onClick={() => setRescheduleTime(slot.start)} aria-pressed={rescheduleTime === slot.start}>
                    <strong>{formatViewingTime(slot.start)}</strong><small>{booked ? 'Booked' : '1 hour'}</small>
                  </button>;
                })}
              </div>
              {rescheduleLoading && <span className="rental-reschedule-feedback" role="status">Checking available times…</span>}
              {rescheduleError && <span className="rental-reschedule-feedback is-error" role="alert">{rescheduleError}</span>}
              <button type="submit" disabled={busyViewingId === viewing.id || !rescheduleTime || !rescheduleAvailability}>{busyViewingId === viewing.id ? 'Saving…' : 'Save new time'}</button>
              <button type="button" disabled={busyViewingId === viewing.id} onClick={() => { setReschedulingViewingId(null); setRescheduleTime(''); setRescheduleAvailability(null); setRescheduleError(''); }}>Keep current time</button>
            </form>}
          </article>;
        })}
        {!isLandlord && viewingsLoading && <p className="tenant-inline-empty" role="status">Loading your viewing requests…</p>}
        {!isLandlord && viewingsError && <p className="tenant-inline-empty" role="alert">{viewingsError}</p>}
        {!isLandlord && !viewingsLoading && !viewingsError && tenantViewings.length === 0 && <p className="tenant-inline-empty">You have no viewing requests yet. Open a property to book a visit.</p>}
      </div>

    </section>
    <section className={`rental-workspace-section${isLandlord ? '' : ' tenant-record-section'}`}>
      <div className="tenant-section-heading">
        <div><span className="eyebrow">{isLandlord ? 'APPLICATION WORKFLOW' : 'YOUR APPLICATIONS'}</span><h3>{isLandlord ? 'Applications to review' : 'Application progress'}</h3></div>
        {!isLandlord && <span className="tenant-section-count">API unavailable</span>}
      </div>
      <div className="rental-record-list">
        {applications.filter((application) => isLandlord || application.tenantId === tenantPreviewId).map((application) => (
          <article className="rental-record" key={application.id}>
            {!isLandlord && <span className="tenant-record-icon tenant-document-icon" aria-hidden="true">▤</span>}
            <div><b>{application.property}</b><span>{isLandlord ? `${application.tenant} · ` : ''}{application.document}</span></div>
            <span className={`rental-status status-${application.status.toLowerCase()}`}>{application.status}</span>
            {isLandlord && application.status === 'PENDING' && <div className="rental-record-actions"><button type="button" onClick={() => setApplicationStatus(application.id, 'APPROVED')}>Approve</button><button type="button" onClick={() => setApplicationStatus(application.id, 'REJECTED')}>Reject</button></div>}
          </article>
        ))}
        {!isLandlord && tenantApplications.length === 0 && <p className="tenant-inline-empty">Rental application records are not available from the connected API.</p>}
      </div>
    </section>
    {!isLandlord && <section className="rental-workspace-section tenant-homes-section"><div className="renter-preview-heading"><div><span className="eyebrow">FIND YOUR NEXT HOME</span><h3>Available landlord listings</h3><p>Explore active homes with photos uploaded by their landlords. Open a listing to view details or request a viewing.</p></div><Link href="/list-layout-new" className="text-link">Browse all homes ↗</Link></div>
      <FeaturedHomes />
    </section>}
    {isLandlord && occupiedProperties.length > 0 && <section className="rental-workspace-section lease-section">
      <div className="lease-section-heading"><div><span className="eyebrow">NEXT STEP · LEASE DETAILS</span><h3>Prepare a lease record</h3><p>Set the key terms for this confirmed rental so both sides can review them together.</p></div><span className="lease-heading-icon" aria-hidden="true">▤</span></div>
      <div className="lease-confirmed-banner"><span className="lease-confirmed-icon" aria-hidden="true">✓</span><div><b>Rental confirmed</b><span>Lease preparation is available after you mark a property as occupied.</span></div></div>
      <form className="lease-preparation-form" onSubmit={prepareLease}>
        <div className="lease-form-section-title"><span>01</span><div><b>Property and tenant</b><small>Confirm who the lease is for.</small></div></div>
        <div className="lease-form-grid">
          <label>Occupied property<select name="leaseProperty" value={String(selectedLeaseProperty?.id ?? '')} onChange={(event) => { setLeasePropertyId(event.target.value); setLeaseSummary(null); }} required>{occupiedProperties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
          <label>Confirmed tenant<input value={selectedLeaseProperty?.rentedByName ?? 'Tenant'} readOnly /></label>
        </div>
        <div className="lease-form-section-title"><span>02</span><div><b>Lease terms</b><small>Add the agreed dates and amounts.</small></div></div>
        <div className="lease-form-grid">
          <label>Lease start date<input required type="date" name="leaseStart" /></label>
          <label>Lease end date<input required type="date" name="leaseEnd" /></label>
          <label>Signing date<input required type="date" name="signingDate" /></label>
          <label>Monthly rent <span className="lease-input-unit">GH₵</span><input required type="number" name="monthlyRent" min="1" step="0.01" placeholder="e.g. 2,500" /></label>
          <label>Security deposit <span className="lease-input-unit">GH₵</span><input required type="number" name="deposit" min="0" step="0.01" placeholder="e.g. 5,000" /></label>
          <label>Rent due day<select name="dueDay" defaultValue="1"><option value="1">1st of each month</option><option value="5">5th of each month</option><option value="10">10th of each month</option><option value="15">15th of each month</option></select></label>
        </div>
        <label className="lease-notes-label">Additional terms <span>Optional</span><textarea name="leaseNotes" rows={3} placeholder="Add any agreed notes for the lease review" /></label>
        {leaseMessage && <p className={`lease-feedback${leaseSummary ? ' is-ready' : ''}`} role="status">{leaseMessage}</p>}
        <div className="lease-form-footer"><p><span aria-hidden="true">ⓘ</span> This prepares a lease summary for review. It does not create a signed or legally binding document.</p><button className="button button-primary" type="submit">Prepare lease summary <span aria-hidden="true">↗</span></button></div>
      </form>
      {leaseSummary && <div className="lease-review-card"><div className="lease-review-header"><div><span className="eyebrow">READY FOR REVIEW</span><h4>{leaseSummary.propertyTitle}</h4></div><span className="rental-status status-pending">DRAFT SUMMARY</span></div><div className="lease-review-grid"><div><small>Tenant</small><b>{leaseSummary.renter}</b></div><div><small>Signing date</small><b>{leaseSummary.signingDate}</b></div><div><small>Lease period</small><b>{leaseSummary.startDate} — {leaseSummary.endDate}</b></div><div><small>Monthly rent</small><b>GH₵ {Number(leaseSummary.monthlyRent).toLocaleString()}</b></div><div><small>Security deposit</small><b>GH₵ {Number(leaseSummary.deposit).toLocaleString()}</b></div><div><small>Rent due</small><b>{leaseSummary.dueDay}{leaseSummary.dueDay === '1' ? 'st' : leaseSummary.dueDay === '2' ? 'nd' : leaseSummary.dueDay === '3' ? 'rd' : 'th'} of each month</b></div></div>{leaseSummary.notes && <p className="lease-review-notes"><b>Additional terms</b>{leaseSummary.notes}</p>}</div>}
    </section>}
    {isLandlord && <p className="rental-info-note">Property and status changes are sent to the connected property API. Application and lease records are not provided by the current API.</p>}
    </>}
  </div>;
}
