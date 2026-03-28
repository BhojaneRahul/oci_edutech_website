"use client";

import Link from "next/link";
import { Building2, CalendarDays, Camera, CheckCircle2, KeyRound, Mail, PencilLine, Phone, Shield, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "../providers/auth-provider";
import { resolveMediaUrl } from "@/lib/utils";

export function AccountPageClient() {
  const { user, loading, setAuthUser, refreshUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackDisplayName =
    String(user?.name ?? "").trim() ||
    String(user?.email ?? "")
      .split("@")[0]
      .trim() ||
    "Account";
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? fallbackDisplayName,
    email: user?.email ?? "",
    university: user?.university ?? "",
    phone: user?.phone ?? "",
    course: user?.course ?? "",
    semester: user?.semester ?? "",
    role: user?.role === "teacher" ? "teacher" : "student"
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [editingField, setEditingField] = useState<null | "name" | "role" | "university" | "phone" | "course" | "semester">(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarEditor, setAvatarEditor] = useState<{
    file: File;
    src: string;
    imageWidth: number;
    imageHeight: number;
    frameSize: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
    cropSize: number;
  } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const profilePhotoUrl = resolveMediaUrl(user?.profilePhoto);
  useEffect(() => {
    if (!user) return;

    setProfileForm({
      name:
        String(user.name ?? "").trim() ||
        String(user.email ?? "")
          .split("@")[0]
          .trim(),
      email: user.email ?? "",
      university: user.university ?? "",
      phone: user.phone ?? "",
      course: user.course ?? "",
      semester: user.semester ?? "",
      role: user.role === "teacher" ? "teacher" : "student"
    });
  }, [user]);

  useEffect(() => {
    if (loading || !user || user.profilePhoto) return;
    refreshUser().catch(() => undefined);
  }, [loading, refreshUser, user]);

  if (loading) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        Loading account...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10">
        Please login to view your account.
      </div>
    );
  }

  const updateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await api.put("/auth/profile", {
        name:
          String(profileForm.name ?? "").trim() ||
          String(user?.name ?? "").trim() ||
          String(user?.email ?? "")
            .split("@")[0]
            .trim(),
        role: profileForm.role,
        university: profileForm.university,
        phone: profileForm.phone,
        course: profileForm.course,
        semester: profileForm.semester
      });
      setAuthUser(response.data.user);
      await refreshUser();
      setMessage(response.data.message);
      setEditingField(null);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Profile update failed.");
    }
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const response = await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage(response.data.message);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setChangingPassword(false);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Password update failed.");
    }
  };

  const openAvatarCropper = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const src = URL.createObjectURL(file);
    const image = await loadImage(src);
    setAvatarEditor({
      file,
      src,
      imageWidth: image.width,
      imageHeight: image.height,
      frameSize: 320,
      zoom: 1,
      offsetX: 50,
      offsetY: 50,
      cropSize: 72
    });
  };

  const uploadAvatar = async () => {
    if (!avatarEditor) return;
    setUploadingAvatar(true);
    setMessage("");
    setError("");
    try {
      const croppedFile = await createCroppedAvatar(avatarEditor);
      const formData = new FormData();
      formData.append("avatar", croppedFile);
      const response = await api.post("/auth/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setAuthUser(response.data.user);
      await refreshUser();
      setMessage(response.data.message);
      URL.revokeObjectURL(avatarEditor.src);
      setAvatarEditor(null);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Avatar upload failed.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      <section id="saved-library" className="rounded-[32px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_32%)] p-1">
          <div className="flex flex-col gap-5 rounded-[24px] bg-white/90 p-5 backdrop-blur dark:bg-slate-900/90 sm:p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600 md:hidden">Account</p>
              <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 md:hidden">
                <Shield className="h-3.5 w-3.5" />
                {user.role === "admin" ? "Administrator" : user.role === "teacher" ? "Teacher" : "Student"}
              </span>

              <div className="mt-4 md:mt-0 md:flex md:items-center md:gap-4">
                <div className="flex justify-center md:block">
                  {profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePhotoUrl} alt={user.name || fallbackDisplayName} className="h-20 w-20 rounded-3xl object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 dark:bg-amber-500/15">
                      <UserRound className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="mt-4 md:mt-0">
                  <p className="hidden text-sm font-semibold uppercase tracking-[0.24em] text-amber-600 md:block">Account</p>
                  <div className="hidden md:mt-2 md:flex md:flex-wrap md:items-center md:gap-3">
                    <h1 className="text-[1.35rem] font-semibold leading-tight text-slate-950 dark:text-white lg:text-[1.45rem]">
                      {user.name || fallbackDisplayName}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <Shield className="h-3.5 w-3.5" />
                      {user.role === "admin" ? "Administrator" : user.role === "teacher" ? "Teacher" : "Student"}
                    </span>
                  </div>
                  <h1 className="mt-3 max-w-[280px] text-[1.2rem] font-semibold leading-tight text-slate-950 dark:text-white sm:text-[1.3rem] md:hidden">
                    {user.name || fallbackDisplayName}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 md:min-w-[240px] md:items-end">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-sm transition hover:border-amber-200 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 md:min-w-[200px]">
                <Camera className="h-4 w-4" />
                Upload Avatar
                <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={openAvatarCropper} />
              </label>

              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-amber-500 dark:text-slate-950 md:min-w-[200px]"
                >
                  <Shield className="h-4 w-4" />
                  Open Admin Dashboard
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</div> : null}
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2">
        <EditableProfileCard
          label="Name"
          value={profileForm.name || "Not added yet"}
          icon={<UserRound className="h-4 w-4" />}
          editing={editingField === "name"}
          onEdit={() => {
            setEditingField("name");
            setChangingPassword(false);
          }}
          onCancel={() => setEditingField(null)}
          onSave={updateProfile}
        >
          <ProfileInput compact value={profileForm.name} onChange={(value) => setProfileForm((current) => ({ ...current, name: value }))} required />
        </EditableProfileCard>

        <StaticProfileCard
          label="Email"
          value={user.email}
          icon={<Mail className="h-4 w-4" />}
          helper="Primary account email. This address cannot be edited."
        />

        <EditableProfileCard
          label="Role"
          value={profileForm.role === "teacher" ? "Teacher" : "Student"}
          icon={<Shield className="h-4 w-4" />}
          editing={editingField === "role"}
          onEdit={() => {
            setEditingField("role");
            setChangingPassword(false);
          }}
          onCancel={() => setEditingField(null)}
          onSave={updateProfile}
        >
          <ProfileSelect
            label="Select Role"
            value={profileForm.role}
            onChange={(value) =>
              setProfileForm((current) => ({
                ...current,
                role: value === "teacher" ? "teacher" : "student"
              }))
            }
            options={[
              { value: "student", label: "Student" },
              { value: "teacher", label: "Teacher" }
            ]}
          />
        </EditableProfileCard>

        <EditableProfileCard
          label="University"
          value={profileForm.university || "Not added yet"}
          icon={<Building2 className="h-4 w-4" />}
          editing={editingField === "university"}
          onEdit={() => {
            setEditingField("university");
            setChangingPassword(false);
          }}
          onCancel={() => setEditingField(null)}
          onSave={updateProfile}
        >
          <ProfileInput compact value={profileForm.university} onChange={(value) => setProfileForm((current) => ({ ...current, university: value }))} required />
        </EditableProfileCard>

        <EditableProfileCard
          label="Phone"
          value={profileForm.phone || "Not added yet"}
          icon={<Phone className="h-4 w-4" />}
          editing={editingField === "phone"}
          onEdit={() => {
            setEditingField("phone");
            setChangingPassword(false);
          }}
          onCancel={() => setEditingField(null)}
          onSave={updateProfile}
        >
          <ProfileInput compact value={profileForm.phone} onChange={(value) => setProfileForm((current) => ({ ...current, phone: value }))} />
        </EditableProfileCard>

        <EditableProfileCard
          label="Course"
          value={profileForm.course || "Not added yet"}
          icon={<Building2 className="h-4 w-4" />}
          editing={editingField === "course"}
          onEdit={() => {
            setEditingField("course");
            setChangingPassword(false);
          }}
          onCancel={() => setEditingField(null)}
          onSave={updateProfile}
        >
          <ProfileInput compact value={profileForm.course} onChange={(value) => setProfileForm((current) => ({ ...current, course: value }))} />
        </EditableProfileCard>

        <EditableProfileCard
          label="Semester"
          value={profileForm.semester || "Not added yet"}
          icon={<CalendarDays className="h-4 w-4" />}
          editing={editingField === "semester"}
          onEdit={() => {
            setEditingField("semester");
            setChangingPassword(false);
          }}
          onCancel={() => setEditingField(null)}
          onSave={updateProfile}
        >
          <ProfileInput compact value={profileForm.semester} onChange={(value) => setProfileForm((current) => ({ ...current, semester: value }))} />
        </EditableProfileCard>

        <StaticProfileCard label="Member Since" value={new Date(user.createdAt).toLocaleDateString()} icon={<CalendarDays className="h-4 w-4" />} />
      </section>

      {changingPassword ? (
        <form onSubmit={updatePassword} className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Security</p>
              <h2 className="mt-2 text-2xl font-semibold">Update your password</h2>
            </div>
            <button
              type="button"
              onClick={() => setChangingPassword(false)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ProfileInput
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
              required
            />
            <ProfileInput
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
              required
            />
            <ProfileInput
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
              required
            />
          </div>

          <button type="submit" className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-amber-500 dark:text-slate-950">
            Update Password
          </button>
        </form>
      ) : null}

      {!changingPassword ? (
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">Security</p>
              <h2 className="mt-2 text-2xl font-semibold">Password and account protection</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Keep your account secure by updating your password whenever needed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setChangingPassword(true);
                setEditingField(null);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-amber-500 dark:text-slate-950"
            >
              <KeyRound className="h-4 w-4" />
              Change Password
            </button>
          </div>
        </section>
      ) : null}

      {avatarEditor ? (
        <AvatarCropModal
          editor={avatarEditor}
          loading={uploadingAvatar}
          onClose={() => {
            URL.revokeObjectURL(avatarEditor.src);
            setAvatarEditor(null);
            if (avatarInputRef.current) {
              avatarInputRef.current.value = "";
            }
          }}
          onChange={setAvatarEditor}
          onSave={uploadAvatar}
        />
      ) : null}
    </div>
  );
}

function StaticProfileCard({
  label,
  value,
  helper,
  icon
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-amber-600 dark:text-amber-400">{icon}</span> : null}
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{helper}</p> : null}
    </div>
  );
}

function EditableProfileCard({
  label,
  value,
  icon,
  editing,
  children,
  onEdit,
  onCancel,
  onSave
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  editing: boolean;
  children: React.ReactNode;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-amber-600 dark:text-amber-400">{icon}</span> : null}
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${label}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:text-slate-300"
          >
            <PencilLine className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {!editing ? (
        <p className="mt-2 text-lg font-semibold">{value}</p>
      ) : (
        <form onSubmit={onSave} className="mt-4 space-y-3">
          {children}
          <div className="flex items-center gap-2">
            <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white dark:bg-amber-500 dark:text-slate-950">
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  required,
  type = "text",
  compact = false
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  compact?: boolean;
}) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</span> : null}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800 ${compact ? "py-2.5" : "py-3"}`}
      />
    </label>
  );
}

function ProfileSelect({
  label,
  value,
  onChange,
  options
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-amber-400 dark:border-slate-800"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AvatarCropModal({
  editor,
  loading,
  onClose,
  onChange,
  onSave
}: {
  editor: {
    file: File;
    src: string;
    imageWidth: number;
    imageHeight: number;
    frameSize: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
    cropSize: number;
  };
  loading: boolean;
  onClose: () => void;
  onChange: (value: {
    file: File;
    src: string;
    imageWidth: number;
    imageHeight: number;
    frameSize: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
    cropSize: number;
  }) => void;
  onSave: () => void;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<null | {
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  }>(null);
  const resizeStateRef = useRef<null | {
    pointerId: number;
    startX: number;
    startY: number;
    startCropSize: number;
    directionX: -1 | 1;
    directionY: -1 | 1;
  }>(null);

  useEffect(() => {
    const updateFrameSize = () => {
      if (!frameRef.current) return;
      const nextSize = Math.round(frameRef.current.getBoundingClientRect().width);
      if (!nextSize || nextSize === editor.frameSize) return;
      onChange({ ...editor, frameSize: nextSize });
    };

    updateFrameSize();
    window.addEventListener("resize", updateFrameSize);
    return () => window.removeEventListener("resize", updateFrameSize);
  }, [editor, onChange]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!frameRef.current) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: editor.offsetX,
      startOffsetY: editor.offsetY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (resizeStateRef.current?.pointerId === event.pointerId) {
      const frameSize = editor.frameSize || frameRef.current?.getBoundingClientRect().width || 320;
      const deltaX = (event.clientX - resizeStateRef.current.startX) * resizeStateRef.current.directionX;
      const deltaY = (event.clientY - resizeStateRef.current.startY) * resizeStateRef.current.directionY;
      const delta = Math.max(deltaX, deltaY);
      const nextCropSize = clamp(
        Math.round((resizeStateRef.current.startCropSize + (delta / frameSize) * 200) * 100) / 100,
        46,
        90
      );
      onChange({
        ...editor,
        cropSize: nextCropSize
      });
      return;
    }

    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;
    const frameSize = editor.frameSize || frameRef.current?.getBoundingClientRect().width || 320;
    const { overflowX, overflowY } = getCoverPlacement(editor.imageWidth, editor.imageHeight, frameSize, editor.zoom, editor.offsetX, editor.offsetY);
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    const nextOffsetX =
      overflowX <= 0
        ? 50
        : clamp(Math.round((dragStateRef.current.startOffsetX - (deltaX / overflowX) * 100) * 100) / 100, 0, 100);
    const nextOffsetY =
      overflowY <= 0
        ? 50
        : clamp(Math.round((dragStateRef.current.startOffsetY - (deltaY / overflowY) * 100) * 100) / 100, 0, 100);

    onChange({
      ...editor,
      offsetX: nextOffsetX,
      offsetY: nextOffsetY
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (resizeStateRef.current?.pointerId === event.pointerId) {
      resizeStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }

    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const startResize =
    (directionX: -1 | 1, directionY: -1 | 1) => (event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      resizeStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startCropSize: editor.cropSize,
        directionX,
        directionY
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    };

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        <div className="relative flex items-center justify-center px-4 py-4 sm:px-6">
          <div className="min-w-0 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/90">Avatar Editor</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">Crop your profile photo</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-white/65">Move the photo or drag the crop corners to fit it perfectly.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 sm:right-6"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden px-3 py-2 sm:px-6">
          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative aspect-square w-full max-w-[min(88vw,560px)] cursor-grab overflow-hidden rounded-[28px] bg-black touch-none active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={editor.src}
              alt="Avatar crop preview"
              className="absolute select-none"
              style={getAvatarPreviewStyle(editor)}
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-0 bg-black/46" />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 overflow-hidden rounded-[20px] border-2 border-white/95"
              style={{
                width: `${editor.cropSize}%`,
                height: `${editor.cropSize}%`,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.38)"
              }}
            >
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="border border-white/18" />
                ))}
              </div>
              <div className="absolute left-0 top-0 h-10 w-10 border-l-4 border-t-4 border-white" />
              <div className="absolute right-0 top-0 h-10 w-10 border-r-4 border-t-4 border-white" />
              <div className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-white" />
              <div className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-r-4 border-white" />
            </div>
            <div
              className="absolute left-1/2 top-1/2 z-10"
              style={{
                width: `${editor.cropSize}%`,
                height: `${editor.cropSize}%`,
                transform: "translate(-50%, -50%)"
              }}
            >
              <button
                type="button"
                onPointerDown={startResize(-1, -1)}
                className="absolute left-0 top-0 h-10 w-10 -translate-x-1/2 -translate-y-1/2 bg-transparent"
                aria-label="Resize crop top left"
              >
                <span className="absolute left-1 top-1 h-1 w-7 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
                <span className="absolute left-1 top-1 h-7 w-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
              </button>
              <button
                type="button"
                onPointerDown={startResize(1, -1)}
                className="absolute right-0 top-0 h-10 w-10 translate-x-1/2 -translate-y-1/2 bg-transparent"
                aria-label="Resize crop top right"
              >
                <span className="absolute right-1 top-1 h-1 w-7 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
                <span className="absolute right-1 top-1 h-7 w-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
              </button>
              <button
                type="button"
                onPointerDown={startResize(-1, 1)}
                className="absolute bottom-0 left-0 h-10 w-10 -translate-x-1/2 translate-y-1/2 bg-transparent"
                aria-label="Resize crop bottom left"
              >
                <span className="absolute bottom-1 left-1 h-1 w-7 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
                <span className="absolute bottom-1 left-1 h-7 w-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
              </button>
              <button
                type="button"
                onPointerDown={startResize(1, 1)}
                className="absolute bottom-0 right-0 h-10 w-10 translate-x-1/2 translate-y-1/2 bg-transparent"
                aria-label="Resize crop bottom right"
              >
                <span className="absolute bottom-1 right-1 h-1 w-7 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
                <span className="absolute bottom-1 right-1 h-7 w-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/90 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-full px-4 py-3 text-base font-medium text-white/85 transition hover:bg-white/8 sm:min-w-[120px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...editor, zoom: 1, offsetX: 50, offsetY: 50, cropSize: 72 })}
              className="inline-flex min-h-12 items-center justify-center rounded-full px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/8 sm:min-w-[120px]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[140px]"
            >
              {loading ? "Saving..." : "Done"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function createCroppedAvatar(editor: {
  file: File;
  src: string;
  imageWidth: number;
  imageHeight: number;
  frameSize: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  cropSize: number;
}) {
  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create image editor");
  }

  const { x, y, scale } = getCoverPlacement(editor.imageWidth, editor.imageHeight, size, 1, editor.offsetX, editor.offsetY);
  const cropSize = size * (editor.cropSize / 100);
  const cropInset = (size - cropSize) / 2;
  const sourceX = clamp((cropInset - x) / scale, 0, editor.imageWidth);
  const sourceY = clamp((cropInset - y) / scale, 0, editor.imageHeight);
  const sourceWidth = Math.min(cropSize / scale, editor.imageWidth - sourceX);
  const sourceHeight = Math.min(cropSize / scale, editor.imageHeight - sourceY);
  const image = await loadImage(editor.src);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));

  if (!blob) {
    throw new Error("Unable to save cropped image");
  }

  return new File([blob], editor.file.name.replace(/\.\w+$/, "") + "-avatar.jpg", { type: "image/jpeg" });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getCoverPlacement(
  imageWidth: number,
  imageHeight: number,
  frameSize: number,
  zoom: number,
  offsetX: number,
  offsetY: number
) {
  const baseScale = Math.max(frameSize / imageWidth, frameSize / imageHeight);
  const scale = baseScale * zoom;
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const overflowX = Math.max(0, drawWidth - frameSize);
  const overflowY = Math.max(0, drawHeight - frameSize);
  const x = -overflowX * (offsetX / 100);
  const y = -overflowY * (offsetY / 100);

  return { drawWidth, drawHeight, x, y, overflowX, overflowY, scale };
}

function getAvatarPreviewStyle(
  editor: {
    imageWidth: number;
    imageHeight: number;
    frameSize: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
  }
) {
  const { drawWidth, drawHeight, x, y } = getCoverPlacement(
    editor.imageWidth,
    editor.imageHeight,
    editor.frameSize,
    editor.zoom,
    editor.offsetX,
    editor.offsetY
  );

  return {
    width: `${drawWidth}px`,
    height: `${drawHeight}px`,
    left: `${x}px`,
    top: `${y}px`
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
