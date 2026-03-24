"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { io, type Socket } from "socket.io-client";
import {
  Bell,
  BellOff,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Flame,
  Heart,
  Image as ImageIcon,
  Loader2,
  MoreVertical,
  Paperclip,
  Reply,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Trash2,
  UserRound,
  Users,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import type {
  CommunityBootstrap,
  CommunityChatMessage,
  CommunityGroup,
  CommunityPresenceMember,
  TeacherVerification
} from "@/lib/types";
import { cn, resolveMediaUrl } from "@/lib/utils";
import { useAuth } from "../providers/auth-provider";

type MuteOption = "1h" | "8h" | "forever";
type ReportReason = "spam" | "abuse" | "inappropriate";
type ReplyTarget = {
  id: number;
  content: string;
  user: {
    id: number;
    name: string | null;
  };
  files?: CommunityChatMessage["files"];
};

const baseUrl = (api.defaults.baseURL || "http://localhost:5000/api").replace(/\/api$/, "");
const reactions = [
  { emoji: "👍", icon: ThumbsUp },
  { emoji: "🔥", icon: Flame },
  { emoji: "❤️", icon: Heart }
] as const;
const reportOptions: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "abuse", label: "Abuse" },
  { value: "inappropriate", label: "Inappropriate" }
];
const mentionRegex = /(@[\w.-]+)/g;

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const formatBytes = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const expiryLabel = (expiresAt: string) => {
  const hours = Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (60 * 60 * 1000)));
  return `Deletes in ${hours}h`;
};

const roleLabel = (role?: string, verifiedTeacher?: boolean) => {
  if (verifiedTeacher || role === "teacher") return "Verified Teacher";
  if (role === "admin") return "Admin";
  return "Student";
};

const getInitials = (name?: string | null) =>
  (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const renderMentions = (text: string) =>
  text.split(mentionRegex).map((part, index) =>
    part.startsWith("@") ? (
      <span key={`${part}-${index}`} className="font-semibold text-amber-600 dark:text-amber-400">
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );

const getFileIcon = (type?: string) => {
  if (type === "image") return ImageIcon;
  if (type === "ppt") return FileImage;
  return FileText;
};

const getFileAccent = (type?: string, mine?: boolean) => {
  if (mine) {
    return {
      panel: "bg-white/10 text-white",
      badge: "bg-white/10 text-white/80",
      card: "border-white/15 bg-white/10"
    };
  }

  switch (type) {
    case "pdf":
      return {
        panel: "bg-amber-50 text-amber-600",
        badge: "bg-amber-50 text-amber-700",
        card: "border-slate-200 bg-white"
      };
    case "doc":
      return {
        panel: "bg-sky-50 text-sky-600",
        badge: "bg-sky-50 text-sky-700",
        card: "border-slate-200 bg-white"
      };
    case "ppt":
      return {
        panel: "bg-orange-50 text-orange-600",
        badge: "bg-orange-50 text-orange-700",
        card: "border-slate-200 bg-white"
      };
    default:
      return {
        panel: "bg-slate-100 text-slate-700",
        badge: "bg-slate-100 text-slate-600",
        card: "border-slate-200 bg-white"
      };
  }
};

const getFileTypeLabel = (type?: string) => {
  switch (type) {
    case "pdf":
      return "PDF";
    case "doc":
      return "DOC";
    case "ppt":
      return "PPT";
    case "image":
      return "IMAGE";
    default:
      return "FILE";
  }
};

const getCommunityFileUrl = (fileId: number) => `${baseUrl}/api/community/files/${fileId}`;

const shouldShowMessageContent = (content?: string, file?: NonNullable<CommunityChatMessage["files"]>[number]) => {
  if (!content?.trim()) return false;
  if (!file) return true;

  const normalizedContent = content.trim().toLowerCase();
  const normalizedFileName = file.fileName.trim().toLowerCase();
  const compactContent = normalizedContent.replace(/\s+/g, " ");
  const compactFileName = normalizedFileName.replace(/\s+/g, " ");

  if (
    compactContent === compactFileName ||
    compactContent === `${compactFileName} shared` ||
    compactContent === `${compactFileName} uploaded` ||
    compactContent === `${compactFileName} sent`
  ) {
    return false;
  }

  if (
    compactContent.includes(compactFileName) &&
    (compactContent.endsWith(" shared") || compactContent.endsWith(" uploaded") || compactContent.endsWith(" sent"))
  ) {
    return false;
  }

  if (compactContent.startsWith(compactFileName)) {
    return false;
  }

  return true;
};

function Avatar({
  name,
  profilePhoto,
  className = "size-10"
}: {
  name?: string | null;
  profilePhoto?: string | null;
  className?: string;
}) {
  const profilePhotoUrl = resolveMediaUrl(profilePhoto);
  if (profilePhotoUrl) {
    return (
      <div className={cn("relative overflow-hidden rounded-full bg-slate-100", className)}>
        <Image alt={name || "User"} fill sizes="48px" src={profilePhotoUrl} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-50 font-semibold text-slate-700",
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className
}: {
  title: string;
  subtitle?: string;
  icon: typeof Users;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_20px_60px_-45px_rgba(2,6,23,0.7)]",
        className
      )}
    >
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Icon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
            {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function CommunityChatClient() {
  const { user, loading } = useAuth();

  const [bootstrap, setBootstrap] = useState<CommunityBootstrap | null>(null);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [messages, setMessages] = useState<CommunityChatMessage[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [onlineMembers, setOnlineMembers] = useState<CommunityPresenceMember[]>([]);
  const [verifiedTeachers, setVerifiedTeachers] = useState<CommunityPresenceMember[]>([]);
  const [verification, setVerification] = useState<TeacherVerification | null>(null);
  const [muteUntil, setMuteUntil] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");
  const [selectedJoinGroupId, setSelectedJoinGroupId] = useState<number | null>(null);
  const [joinName, setJoinName] = useState("");
  const [teacherForm, setTeacherForm] = useState({
    fullName: "",
    university: "",
    subjectExpertise: ""
  });
  const [teacherCard, setTeacherCard] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<number | null>(null);
  const [mobileActionMessage, setMobileActionMessage] = useState<CommunityChatMessage | null>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
  const [fileActionState, setFileActionState] = useState<{ fileName: string; mode: "view" | "download" } | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [teachersOpen, setTeachersOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<CommunityChatMessage | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const [keyboardInset, setKeyboardInset] = useState(0);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const previewLoadingRef = useRef<Set<number>>(new Set());
  const previewUrlsRef = useRef<Record<number, string>>({});
  const [filePreviewUrls, setFilePreviewUrls] = useState<Record<number, string>>({});

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) || null,
    [activeGroupId, groups]
  );
  const approvedTeacherVerification = useMemo(
    () => Boolean(verification?.status === "approved" && verification.communityGroup?.id),
    [verification]
  );

  const isMuted = useMemo(() => {
    if (!muteUntil) return false;
    return muteUntil === "forever" || new Date(muteUntil).getTime() > Date.now();
  }, [muteUntil]);

  const currentUserRank = useMemo(() => onlineMembers.find((member) => member.id === user?.id) || null, [onlineMembers, user?.id]);

  const resizeComposer = (nextHeight?: number) => {
    const textarea = composerTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(nextHeight ?? textarea.scrollHeight, 112)}px`;
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setIsBootstrapping(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        setIsBootstrapping(true);
        const { data } = await api.get("/community");
        if (cancelled) return;
        const payload = data as CommunityBootstrap;
        setBootstrap(payload);
        setGroups(payload.groups || []);
        setActiveGroupId(payload.activeGroupId ?? null);
        setMessages(payload.messages || []);
        setOnlineMembers(payload.onlineMembers || []);
        setVerifiedTeachers(payload.verifiedTeachers || []);
        setVerification(payload.verification || null);
        setMuteUntil(
          payload.muteSetting?.muteUntil
            ? String(payload.muteSetting.muteUntil)
            : null
        );
        setSelectedJoinGroupId(
          payload.activeGroupId ??
            payload.verification?.communityGroup?.id ??
            payload.groups?.[0]?.id ??
            null
        );
        setJoinName(user.name || "");
        if (payload.verification?.status === "approved") {
          setSelectedRole("teacher");
        }
        setTeacherForm((current) => ({
          ...current,
          fullName: current.fullName || payload.verification?.fullName || user.name || "",
          university: current.university || payload.verification?.university || "",
          subjectExpertise: current.subjectExpertise || payload.verification?.subjectExpertise || ""
        }));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("We couldn’t load the community right now. Please refresh once.");
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  useEffect(() => {
    if (!activeGroupId || !user) return;

    void api
      .post("/community/presence", { groupId: activeGroupId })
      .then(({ data }) => {
        setOnlineMembers(data.onlineMembers || []);
      })
      .catch((err) => {
        console.error("Community presence bootstrap failed", err);
      });

    const socket = io(baseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    socketRef.current = socket;
    const joinActiveGroup = () => {
      socket.emit("community:join", { groupId: activeGroupId });
    };

    socket.on("connect", joinActiveGroup);
    if (socket.connected) {
      joinActiveGroup();
    }

    socket.on("community:message", (message: CommunityChatMessage) => {
      setMessages((current) => {
        const next = current.filter((item) => item.id !== message.id);
        next.push(message);
        return next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    });

    socket.on("community:message:update", (message: CommunityChatMessage) => {
      setMessages((current) => current.map((item) => (item.id === message.id ? message : item)));
    });

    socket.on("community:presence", (payload: { onlineMembers: CommunityPresenceMember[] }) => {
      setOnlineMembers(payload.onlineMembers || []);
    });

    socket.on("community:typing", (payload: { userId: number; userName: string; typing: boolean }) => {
      setTypingUsers((current) => {
        const next = { ...current };
        if (payload.typing) {
          next[payload.userId] = payload.userName;
        } else {
          delete next[payload.userId];
        }
        return next;
      });
    });

    socket.on("community:history:cleared", (payload: { groupId: number }) => {
      if (payload.groupId === activeGroupId) {
        setMessages([]);
      }
    });

    socket.on("community:message:delete", (payload: { groupId: number; messageIds: number[] }) => {
      if (payload.groupId !== activeGroupId) return;
      setMessages((current) => current.filter((item) => !payload.messageIds.includes(item.id)));
      setSelectedMessageIds((current) => current.filter((id) => !payload.messageIds.includes(id)));
    });

    socket.on("connect_error", (connectionError) => {
      console.error("Community socket connection failed", connectionError);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeGroupId, user]);

  useEffect(() => {
    if (!activeGroupId || !user) return;

    const intervalId = window.setInterval(() => {
      void api
        .post("/community/presence", { groupId: activeGroupId })
        .then(({ data }) => {
          setOnlineMembers(data.onlineMembers || []);
        })
        .catch((err) => {
          console.error("Community presence refresh failed", err);
        });

      void api
        .get(`/community/${activeGroupId}/messages`)
        .then(({ data }) => {
          setMessages(data.messages || []);
          setVerifiedTeachers(data.verifiedTeachers || []);
          setOnlineMembers(data.onlineMembers || []);
        })
        .catch((err) => {
          console.error("Community message refresh failed", err);
        });
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeGroupId, user]);

  useEffect(() => {
    if (!activeGroupId || !user) return;

    void api.put("/notifications/read-all?type=community_message").catch((err) => {
      console.error(err);
    });
  }, [activeGroupId, user]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const imageFiles =
      messages
        .flatMap((message) => message.files || [])
        .filter((file) => file.fileType === "image" && !filePreviewUrls[file.id]) || [];

    imageFiles.forEach((file) => {
      if (previewLoadingRef.current.has(file.id)) return;
      previewLoadingRef.current.add(file.id);

      void fetch(`${baseUrl}/api/community/files/${file.id}`, {
        credentials: "include"
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Preview fetch failed");
          const blob = await response.blob();
          const objectUrl = window.URL.createObjectURL(blob);
          const previousUrl = previewUrlsRef.current[file.id];
          if (previousUrl) {
            window.URL.revokeObjectURL(previousUrl);
          }
          previewUrlsRef.current[file.id] = objectUrl;
          setFilePreviewUrls((current) => ({ ...current, [file.id]: objectUrl }));
        })
        .catch((err) => {
          console.error(err);
          const fallbackUrl = resolveMediaUrl(file.fileUrl);
          if (fallbackUrl) {
            setFilePreviewUrls((current) => ({ ...current, [file.id]: fallbackUrl }));
          }
        })
        .finally(() => {
          previewLoadingRef.current.delete(file.id);
        });
    });
  }, [filePreviewUrls, messages]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        window.URL.revokeObjectURL(url);
      });
      previewUrlsRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const updateKeyboardInset = () => {
      const inset = Math.max(window.innerHeight - viewport.height - viewport.offsetTop, 0);
      setKeyboardInset(inset > 0 ? inset : 0);
    };

    updateKeyboardInset();
    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
    };
  }, []);

  const notifyTyping = (typing: boolean) => {
    if (!socketRef.current || !activeGroupId) return;
    socketRef.current.emit("community:typing", { groupId: activeGroupId, typing });
  };

  const handleComposerChange = (value: string) => {
    setComposer(value);
    resizeComposer();
    notifyTyping(true);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => notifyTyping(false), 1200);
  };

  const refreshMessages = async (groupId: number) => {
    const { data } = await api.get(`/community/${groupId}/messages`);
    setMessages(data.messages || []);
    setVerifiedTeachers(data.verifiedTeachers || []);
    setOnlineMembers(data.onlineMembers || []);
  };

  const handleCommunityFileAction = async (
    file: NonNullable<CommunityChatMessage["files"]>[number],
    mode: "view" | "download"
  ) => {
    if (typeof window === "undefined") return;

    const fallbackUrl = resolveMediaUrl(file.fileUrl);

    try {
      setError(null);
      setFileActionState({ fileName: file.fileName, mode });

      const response = await fetch(`${baseUrl}/api/community/files/${file.id}${mode === "download" ? "?download=1" : ""}`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("File request failed");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      if (mode === "download") {
        anchor.download = file.fileName;
      } else {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30_000);
    } catch (err) {
      console.error(err);
      if (fallbackUrl) {
        const anchor = document.createElement("a");
        anchor.href = fallbackUrl;
        if (mode === "download") {
          anchor.download = file.fileName;
        } else {
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
        }
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } else {
        setError(`We couldn’t ${mode} this file right now.`);
      }
    } finally {
      setFileActionState(null);
    }
  };

  const openDesktopMessageMenu = (messageId: number) => {
    setActiveMessageMenuId((current) => (current === messageId ? null : messageId));
  };

  const startLongPress = (message: CommunityChatMessage) => {
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      setMobileActionMessage(message);
      setActiveMessageMenuId(null);
    }, 420);
  };

  const clearLongPress = () => {
    if (typeof window === "undefined") return;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const closeAllMessageMenus = () => {
    setActiveMessageMenuId(null);
    setMobileActionMessage(null);
  };

  const canDeleteMessage = (message: CommunityChatMessage) =>
    Boolean(user && (message.user.id === user.id || user.role === "admin"));

  const toggleMessageSelection = (messageId: number) => {
    setSelectedMessageIds((current) =>
      current.includes(messageId) ? current.filter((id) => id !== messageId) : [...current, messageId]
    );
  };

  const enterSelectionMode = (messageId: number) => {
    setSelectedMessageIds((current) => (current.includes(messageId) ? current : [...current, messageId]));
    closeAllMessageMenus();
  };

  const clearSelectedMessages = () => setSelectedMessageIds([]);

  const handleDeleteMessages = async (messageIds?: number[]) => {
    if (!activeGroupId) return;
    const ids = (messageIds && messageIds.length ? messageIds : selectedMessageIds).filter(Boolean);
    if (!ids.length) return;

    try {
      await api.post("/community/delete", { groupId: activeGroupId, messageIds: ids });
      setMessages((current) => current.filter((item) => !ids.includes(item.id)));
      setSelectedMessageIds((current) => current.filter((id) => !ids.includes(id)));
      closeAllMessageMenus();
    } catch (err: any) {
      setError(err?.response?.data?.error || "We couldn’t delete those messages.");
    }
  };

  const handleJoin = async () => {
    if (!selectedJoinGroupId || !joinName.trim()) {
      setError("Add your name and pick a community to continue.");
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      const { data } = await api.post("/community/join", {
        groupId: selectedJoinGroupId,
        role: selectedRole,
        name: joinName.trim()
      });
      const joinedGroupId = data.activeGroupId ?? selectedJoinGroupId;
      setActiveGroupId(joinedGroupId);
      setVerification(data.verification || null);
      setMenuOpen(false);
      await refreshMessages(joinedGroupId);
    } catch (err: any) {
      setError(err?.response?.data?.error || "We couldn’t join the community right now.");
    } finally {
      setIsSending(false);
    }
  };

  const handleTeacherVerification = async () => {
    if (!selectedJoinGroupId) {
      setError("Select a community first.");
      return;
    }
    if (!teacherForm.fullName.trim() || !teacherForm.university.trim() || !teacherForm.subjectExpertise.trim() || !teacherCard) {
      setError("Complete every teacher verification field before submitting.");
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      const formData = new FormData();
      formData.append("communityGroupId", String(selectedJoinGroupId));
      formData.append("fullName", teacherForm.fullName.trim());
      formData.append("university", teacherForm.university.trim());
      formData.append("subjectExpertise", teacherForm.subjectExpertise.trim());
      formData.append("idCard", teacherCard);

      const { data } = await api.post("/community/teacher-verification", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setVerification(data.verification || null);
      setTeacherCard(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "We couldn’t submit your verification.");
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    if (!activeGroupId) return;
    if (!composer.trim() && !attachment) return;

    try {
      setError(null);
      if (attachment) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("groupId", String(activeGroupId));
        if (composer.trim()) formData.append("text", composer.trim());
        if (replyTarget?.id) formData.append("replyToId", String(replyTarget.id));
        formData.append("file", attachment);
        await api.post("/community/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/community/send", {
          groupId: activeGroupId,
          text: composer.trim(),
          replyToId: replyTarget?.id || null,
          mentions: Array.from(new Set((composer.match(mentionRegex) || []).map((item) => item.replace("@", ""))))
        });
      }
      setComposer("");
      if (composerTextareaRef.current) {
        composerTextareaRef.current.style.height = "44px";
      }
      setAttachment(null);
      setReplyTarget(null);
      notifyTyping(false);
      await refreshMessages(activeGroupId);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Message could not be sent.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReaction = async (messageId: number, reactionType: string) => {
    try {
      await api.post("/community/react", { messageId, reactionType });
      closeAllMessageMenus();
      await refreshMessages(activeGroupId!);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async () => {
    if (!reportingMessage || !activeGroupId) return;
    try {
      await api.post("/community/report", {
        groupId: activeGroupId,
        messageId: reportingMessage.id,
        reportedUserId: reportingMessage.user.id,
        reason: reportReason
      });
      setReportingMessage(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "We couldn’t submit that report.");
    }
  };

  const handleMute = async (option: MuteOption) => {
    if (!activeGroupId) return;
    try {
      const { data } = await api.post("/community/mute", { groupId: activeGroupId, option });
      setMuteUntil(data.muteSetting?.muteUntil || "forever");
      setMenuOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Mute setting could not be updated.");
    }
  };

  const handleUnmute = async () => {
    if (!activeGroupId) return;
    try {
      await api.post("/community/unmute", { groupId: activeGroupId });
      setMuteUntil(null);
      setMenuOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Unmute failed.");
    }
  };

  const handleClear = async () => {
    if (!activeGroupId) return;
    try {
      await api.post("/community/clear", { groupId: activeGroupId });
      setMessages([]);
      setMenuOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || "We couldn’t clear your chat history.");
    }
  };

  const handleLeave = async () => {
    if (!activeGroupId) return;
    try {
      await api.post("/community/leave", { groupId: activeGroupId });
      setActiveGroupId(null);
      setMessages([]);
      setMenuOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Exit community failed.");
    }
  };

  const typingNames = Object.values(typingUsers).filter((name) => name && name !== user?.name);
  const typingLabel = useMemo(() => {
    if (!typingNames.length) return null;
    if (typingNames.length === 1) return `${typingNames[0]} is typing`;
    if (typingNames.length === 2) return `${typingNames[0]} and ${typingNames[1]} are typing`;
    return `${typingNames[0]} and ${typingNames.length - 1} others are typing`;
  }, [typingNames]);

  if (loading || isBootstrapping) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="size-4 animate-spin text-amber-500" />
          Loading community workspace
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <SectionCard title="Login required" subtitle="Community access is available after sign-in." icon={Users}>
          <p className="text-sm text-slate-600">Sign in first to join your degree community, chat with classmates, and access shared files.</p>
        </SectionCard>
      </div>
    );
  }

  if (!activeGroup) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <SectionCard
            title="Join your study community"
            subtitle="Pick your group, unlock live chat, and connect with verified teachers."
            icon={Users}
          >
            <div className="space-y-6">
              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Your name</span>
                  <input
                    value={joinName}
                    onChange={(event) => setJoinName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-amber-300"
                    placeholder="Rahul Nayakuba Bhojane"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Role</span>
                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 p-2">
                    {(["student", "teacher"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          "rounded-xl px-4 py-3 text-sm font-medium transition",
                          selectedRole === role ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600"
                        )}
                      >
                        {role === "student" ? "Student" : "Teacher"}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium text-slate-700">Choose community</span>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedJoinGroupId(group.id)}
                      className={cn(
                        "rounded-[24px] border px-4 py-4 text-left transition",
                        selectedJoinGroupId === group.id
                          ? "border-amber-300 bg-amber-50 shadow-[0_18px_45px_-34px_rgba(245,158,11,0.65)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="text-base font-semibold text-slate-950">{group.name}</div>
                      <p className="mt-2 text-sm text-slate-500">{group.description || "Community discussion space"}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedRole === "student" ? (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isSending}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSending ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
                  Join community
                </button>
              ) : approvedTeacherVerification ? (
                <div className="space-y-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                  <div>
                    <h4 className="text-base font-semibold text-slate-950">Verified teacher access approved</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Your verification is already approved for{" "}
                      <span className="font-semibold text-slate-900">{verification?.communityGroup?.name}</span>. You can
                      enter the chat directly without submitting the form again.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700">
                    Current verification status: <span className="font-semibold capitalize">{verification?.status}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={isSending}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    Enter community chat
                  </button>
                </div>
              ) : (
                <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <h4 className="text-base font-semibold text-slate-950">Teacher verification</h4>
                    <p className="mt-1 text-sm text-slate-500">Teachers join after admin approval and receive a verified badge.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Full name</span>
                      <input
                        value={teacherForm.fullName}
                        onChange={(event) => setTeacherForm((current) => ({ ...current, fullName: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">University</span>
                      <input
                        value={teacherForm.university}
                        onChange={(event) => setTeacherForm((current) => ({ ...current, university: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">Subject expertise</span>
                      <input
                        value={teacherForm.subjectExpertise}
                        onChange={(event) => setTeacherForm((current) => ({ ...current, subjectExpertise: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        placeholder="Programming in C, Data Structures"
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">College ID card</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) => setTeacherCard(event.target.files?.[0] || null)}
                        className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3"
                      />
                    </label>
                  </div>
                  {verification ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Current verification status: <span className="font-semibold capitalize">{verification.status}</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleTeacherVerification}
                    disabled={isSending}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    Submit for approval
                  </button>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="What happens next" subtitle="Community access rules" icon={Sparkles}>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">Students join immediately after choosing a group.</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">Teachers submit verification and enter after admin approval.</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">Messages and uploaded files automatically expire after 24 hours.</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">You can leave the current group or mute notifications any time.</div>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  const renderMessage = (message: CommunityChatMessage) => {
    const mine = message.user.id === user.id;
    const file = message.files?.[0];
    const FileIcon = getFileIcon(file?.fileType);
    const fileAccent = getFileAccent(file?.fileType, mine);
    const filePreviewUrl = file ? filePreviewUrls[file.id] || resolveMediaUrl(file.fileUrl) : null;
    const desktopMenuOpen = activeMessageMenuId === message.id;
    const selected = selectedMessageIds.includes(message.id);
    const reactionSummaries = reactions
      .map((reaction) => {
        const groupedReaction = message.reactions?.find((item) => item.emoji === reaction.emoji);
        if (!groupedReaction?.count) return null;
        return {
          emoji: reaction.emoji,
          count: groupedReaction.count,
          active: Boolean(groupedReaction.userIds?.includes(Number(user.id)))
        };
      })
      .filter(Boolean) as { emoji: string; count: number; active: boolean }[];

    return (
      <article
        key={message.id}
        className={cn("flex w-full overflow-visible", mine ? "justify-end" : "justify-start")}
        onClick={selectedMessageIds.length ? () => toggleMessageSelection(message.id) : undefined}
      >
        <div
          className={cn(
            "flex min-w-0 max-w-full items-end gap-2.5 overflow-visible sm:max-w-[min(100%,760px)] sm:gap-3",
            mine && "flex-row-reverse"
          )}
        >
          <Avatar name={message.user.name} profilePhoto={message.user.profilePhoto} className="size-9 shrink-0 sm:size-10" />
          <div className="relative min-w-0 max-w-[calc(100%-44px)] space-y-2 overflow-visible sm:max-w-[min(78vw,620px)]">
            <div
              className={cn(
                "min-w-0 rounded-[24px] border px-3.5 py-3 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)] sm:rounded-[28px] sm:px-4",
                selected && "ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950",
                mine ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900"
              )}
              onTouchStart={() => startLongPress(message)}
              onTouchEnd={clearLongPress}
              onTouchCancel={clearLongPress}
              onTouchMove={clearLongPress}
            >
              <div className={cn("flex flex-wrap items-center gap-2 text-xs sm:text-sm", mine ? "text-white/80" : "text-slate-500")}>
                <span className={cn("font-semibold", mine ? "text-white" : "text-slate-950")}>{message.user.name}</span>
                {message.user.verifiedTeacher ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                    <ShieldCheck className="size-3" />
                    Verified Teacher
                  </span>
                ) : null}
                <span>{formatTime(message.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => openDesktopMessageMenu(message.id)}
                  className={cn(
                    "ml-auto hidden rounded-full border p-2 transition lg:inline-flex",
                    mine ? "border-white/15 text-white/70 hover:bg-white/10" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <MoreVertical className="size-4" />
                </button>
              </div>

              {message.replyTo ? (
                <button
                  type="button"
                  onClick={() => setReplyTarget(message.replyTo || null)}
                  className={cn(
                    "mt-3 flex w-full items-start gap-2 rounded-2xl border px-3 py-2 text-left",
                    mine ? "border-white/15 bg-white/10" : "border-slate-200 bg-slate-50"
                  )}
                >
                  <Reply className={cn("mt-0.5 size-4 shrink-0", mine ? "text-white/75" : "text-slate-400")} />
                  <div className="min-w-0">
                    <div className={cn("text-xs font-semibold", mine ? "text-white/80" : "text-slate-600")}>
                      Replying to {message.replyTo.user.name}
                    </div>
                    <div className={cn("truncate text-sm", mine ? "text-white/95" : "text-slate-700")}>
                      {message.replyTo.content || "Attachment"}
                    </div>
                  </div>
                </button>
              ) : null}

              {shouldShowMessageContent(message.content, file) ? (
                <div className="mt-3 break-words text-[14px] leading-6 sm:text-[15px] sm:leading-7">
                  {renderMentions(message.content)}
                </div>
              ) : null}

              {file ? (
                <div className={cn("mt-3 overflow-hidden rounded-[22px] border shadow-sm", fileAccent.card)}>
                    {file.fileType === "image" ? (
                      <button
                        type="button"
                        onClick={() => void handleCommunityFileAction(file, "view")}
                        className="block w-full text-left"
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                          {filePreviewUrl ? (
                            <Image
                              alt={file.fileName}
                              src={filePreviewUrl}
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 100vw, 720px"
                              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="size-6 animate-spin" />
                                <span className="text-xs font-medium">Loading preview</span>
                              </div>
                            </div>
                          )}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent px-4 py-3 text-white">
                            <div className="mt-1 text-xs text-white/75">
                            {getFileTypeLabel(file.fileType)} · {formatBytes(file.sizeBytes)}
                          </div>
                        </div>
                      </div>
                    </button>
                    ) : (
                      <div className="flex min-w-0 items-start gap-3 px-3 py-3 sm:px-4 sm:py-4">
                        <div
                          className={cn(
                            "flex size-16 shrink-0 flex-col items-center justify-center rounded-[20px] border",
                            mine ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700"
                          )}
                        >
                          <FileIcon className="size-7" />
                          <span className="mt-1 text-[10px] font-semibold tracking-[0.18em]">{getFileTypeLabel(file.fileType)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={cn("line-clamp-2 text-sm font-semibold", mine ? "text-white" : "text-slate-900")}>
                            {file.fileName}
                          </div>
                          <div className={cn("mt-1 text-xs", mine ? "text-white/70" : "text-slate-500")}>
                            {getFileTypeLabel(file.fileType)} · {formatBytes(file.sizeBytes)}
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
                    <div className={cn("text-xs", mine ? "text-white/70" : "text-amber-600")}>{expiryLabel(file.expiresAt)}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleCommunityFileAction(file, "view")}
                          className={cn(
                            "inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold",
                            mine ? "bg-white text-slate-950" : "bg-slate-950 text-white"
                          )}
                          disabled={Boolean(fileActionState)}
                        >
                          <ExternalLink className="size-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCommunityFileAction(file, "download")}
                          className={cn(
                            "inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                            mine ? "border-white/20 text-white" : "border-slate-200 text-slate-700",
                            fileActionState ? "opacity-70" : ""
                          )}
                          disabled={Boolean(fileActionState)}
                        >
                          <Download className="size-3.5" />
                          Download
                        </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {reactionSummaries.length ? (
              <div className={cn("flex flex-wrap items-center gap-2", mine ? "justify-end" : "justify-start")}>
                {reactionSummaries.map((reaction) => (
                  <button
                    key={`${message.id}-${reaction.emoji}`}
                    type="button"
                    onClick={() => void handleReaction(message.id, reaction.emoji)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      reaction.active ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500"
                    )}
                  >
                    <span>{reaction.emoji}</span>
                    <span>{reaction.count}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {desktopMenuOpen ? (
              <div
                className={cn(
                  "absolute top-12 z-50 hidden min-w-[260px] rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)] lg:block dark:border-slate-800 dark:bg-slate-950",
                  mine ? "right-0" : "left-0"
                )}
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  {reactions.map((reaction) => (
                    <button
                      key={`${message.id}-menu-${reaction.emoji}`}
                      type="button"
                      onClick={() => void handleReaction(message.id, reaction.emoji)}
                      className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg transition hover:border-amber-300 hover:bg-amber-50"
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTarget(message);
                      setActiveMessageMenuId(null);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <Reply className="size-4" />
                    Reply
                  </button>
                  {!mine ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReportingMessage(message);
                        setActiveMessageMenuId(null);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <ShieldAlert className="size-4" />
                      Report
                    </button>
                  ) : null}
                  {canDeleteMessage(message) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleDeleteMessages([message.id])}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="size-4" />
                        Delete for everyone
                      </button>
                      <button
                        type="button"
                        onClick={() => enterSelectionMode(message.id)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <CheckCircle2 className="size-4" />
                        Select messages
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="flex h-[calc(100dvh-80px)] min-h-[calc(100dvh-80px)] w-full flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-30 overflow-visible border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:border-slate-800 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/90">
        {selectedMessageIds.length ? (
          <div className="border-b border-amber-200 bg-amber-50/90 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-500/10 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {selectedMessageIds.length} selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearSelectedMessages}
                  className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-amber-500/20 dark:bg-slate-950 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteMessages()}
                  className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex w-full items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <Users className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-slate-950 dark:text-slate-100 sm:text-xl">{activeGroup.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 sm:gap-3">
                  <span>{onlineMembers.length} online members</span>
                  {isMuted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      <BellOff className="size-3.5" />
                      Muted
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-40">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              <MoreVertical className="size-5" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-full z-[90] mt-2 w-72 rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950">
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setTeachersOpen(false);
                      setMembersOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <span className="flex items-center gap-3">
                      <Users className="size-4" />
                      Online members
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{onlineMembers.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setMembersOpen(false);
                      setTeachersOpen(true);
                    }}
                    className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <span className="flex items-center gap-3">
                      <ShieldCheck className="size-4" />
                      Verified teachers
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{verifiedTeachers.length}</span>
                  </button>
                </div>

                <div className="mt-1 space-y-1 lg:mt-0">
                  <button
                    type="button"
                    onClick={() => void handleClear()}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <Trash2 className="size-4" />
                    Clear my chat history
                  </button>
                  {isMuted ? (
                    <button
                      type="button"
                      onClick={() => void handleUnmute()}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <Bell className="size-4" />
                      Unmute notifications
                    </button>
                  ) : (
                    <div className="rounded-2xl px-2 py-2">
                      <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Mute notifications</div>
                      {(["1h", "8h", "forever"] as MuteOption[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => void handleMute(option)}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          <BellOff className="size-4" />
                          {option === "1h" ? "1 hour" : option === "8h" ? "8 hours" : "Forever"}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleLeave()}
                    className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <X className="size-4" />
                    Exit community
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 w-full flex-1 gap-0 overflow-x-hidden px-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden bg-white dark:bg-slate-950 lg:border-x lg:border-slate-200 lg:dark:border-slate-800">
          <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-500 dark:text-slate-400">{activeGroup.description || "Real-time student discussion space"}</div>
            </div>
            {replyTarget ? (
              <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <div className="min-w-0">
                  <div className="font-semibold">Replying to {replyTarget.user.name}</div>
                  <div className="truncate">{replyTarget.content || replyTarget.files?.[0]?.fileName || "Attachment"}</div>
                </div>
                <button type="button" onClick={() => setReplyTarget(null)} className="rounded-full p-1 text-amber-700 dark:text-amber-300">
                  <X className="size-4" />
                </button>
              </div>
            ) : null}
            {attachment ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <div className="min-w-0 truncate">{attachment.name}</div>
                <button type="button" onClick={() => setAttachment(null)} className="rounded-full p-1 text-slate-500 dark:text-slate-400">
                  <X className="size-4" />
                </button>
              </div>
            ) : null}
            {error ? (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
            ) : null}
          </div>

          <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-5 sm:py-5 lg:px-6">
            <div className="space-y-5">
              {messages.length ? (
                messages.map(renderMessage)
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-800">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    <Sparkles className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Start the conversation</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Messages and uploaded files stay available for 24 hours before they expire automatically.</p>
                </div>
              )}
              <div className="h-10 sm:h-16" ref={messageEndRef} />
            </div>
          </div>

            <div
              className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-1 shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.2)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-[0_-18px_40px_-28px_rgba(2,6,23,0.55)] sm:px-3 sm:pt-2 lg:px-4 lg:pt-3"
              style={{
                bottom: keyboardInset ? `${keyboardInset}px` : undefined,
                paddingBottom: keyboardInset ? "0.15rem" : "max(env(safe-area-inset-bottom, 0px), 0.15rem)"
              }}
            >
              {typingLabel ? (
                <div className="px-1 pb-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.25s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-current" />
                    </span>
                    {typingLabel}...
                  </div>
                </div>
              ) : null}
              <div className="flex items-end gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:size-12"
              >
                {isUploading ? <Loader2 className="size-5 animate-spin" /> : <Paperclip className="size-5" />}
              </button>
                <div className="min-w-0 flex-1 overflow-hidden rounded-[20px] border border-slate-200 bg-white px-3 py-1 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_20px_50px_-40px_rgba(2,6,23,0.65)] sm:rounded-[24px] sm:px-4 sm:py-2.5">
                  <textarea
                    ref={composerTextareaRef}
                    rows={1}
                    value={composer}
                    onChange={(event) => handleComposerChange(event.target.value)}
                    onFocus={() => resizeComposer(44)}
                    onBlur={() => notifyTyping(false)}
                    placeholder={`Message ${activeGroup.name}... Use @name for mentions`}
                    className="block max-h-28 min-h-[38px] w-full resize-none overflow-y-auto bg-transparent pt-1 text-[14px] leading-5 text-slate-900 outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 sm:min-h-[44px] sm:text-[15px] sm:leading-6"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
              </div>
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isSending || isUploading || (!composer.trim() && !attachment)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.8)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 sm:size-12"
              >
                {isSending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                className="hidden"
                onChange={(event) => setAttachment(event.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>

        <div className="hidden border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:block">
          <SectionCard title="Online Members" subtitle="Live community presence" icon={Users} className="rounded-none border-0 border-b border-slate-200 shadow-none dark:border-slate-800">
            <div className="space-y-3">
              {onlineMembers.length ? (
                onlineMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                    <Avatar name={member.name} profilePhoto={member.profilePhoto} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{member.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{roleLabel(member.role, member.verifiedTeacher)}</div>
                    </div>
                    <span className="size-2 rounded-full bg-emerald-500" />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">No one is online right now.</div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Verified Teachers" subtitle="Approved mentors in this group" icon={ShieldCheck} className="rounded-none border-0 shadow-none">
            <div className="space-y-3">
              {verifiedTeachers.length ? (
                verifiedTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-3 rounded-2xl bg-amber-50 px-3 py-3 dark:bg-amber-500/10">
                    <Avatar name={teacher.name} profilePhoto={teacher.profilePhoto} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{teacher.name}</div>
                      <div className="text-xs text-amber-700 dark:text-amber-300">Verified Teacher</div>
                    </div>
                    <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">No verified teachers available yet.</div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {membersOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={() => setMembersOpen(false)}>
          <div
            className="absolute inset-x-4 top-24 rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-500">Online Members</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">Live community presence</div>
              </div>
              <button
                type="button"
                onClick={() => setMembersOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {onlineMembers.length ? (
                onlineMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Avatar name={member.name} profilePhoto={member.profilePhoto} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">{member.name}</div>
                      <div className="text-xs text-slate-500">{roleLabel(member.role, member.verifiedTeacher)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">No one is online right now.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {teachersOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={() => setTeachersOpen(false)}>
          <div
            className="absolute inset-x-4 top-24 rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-500">Verified Teachers</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">Approved mentors in this group</div>
              </div>
              <button
                type="button"
                onClick={() => setTeachersOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {verifiedTeachers.length ? (
                verifiedTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Avatar name={teacher.name} profilePhoto={teacher.profilePhoto} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">{teacher.name}</div>
                      <div className="text-xs text-amber-700">Verified Teacher</div>
                    </div>
                    <ShieldCheck className="size-4 text-amber-600" />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">No verified teachers available yet.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {fileActionState ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-40 rounded-[24px] border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-50 p-2 text-amber-600">
              <Loader2 className="size-4 animate-spin" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                {fileActionState.mode === "download" ? "Downloading file" : "Opening file"}
              </div>
              <div className="truncate text-xs text-slate-500">{fileActionState.fileName}</div>
            </div>
          </div>
        </div>
      ) : null}

      {mobileActionMessage ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={closeAllMessageMenus}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-slate-200 bg-white px-5 pb-8 pt-4 shadow-[0_-20px_60px_-30px_rgba(15,23,42,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-200" />
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">{mobileActionMessage.user.name}</div>
              <div className="mt-1 line-clamp-3">
                {mobileActionMessage.content || mobileActionMessage.files?.[0]?.fileName || "Attachment"}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {reactions.map((reaction) => (
                <button
                  key={`${mobileActionMessage.id}-mobile-${reaction.emoji}`}
                  type="button"
                  onClick={() => void handleReaction(mobileActionMessage.id, reaction.emoji)}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg transition hover:border-amber-300 hover:bg-amber-50"
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(mobileActionMessage);
                  setMobileActionMessage(null);
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700"
              >
                <Reply className="size-4" />
                Reply
              </button>
              {mobileActionMessage.user.id !== user.id ? (
                <button
                  type="button"
                  onClick={() => {
                    setReportingMessage(mobileActionMessage);
                    setMobileActionMessage(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 px-4 py-3 text-left text-sm font-medium text-rose-600"
                >
                  <ShieldAlert className="size-4" />
                  Report
                </button>
              ) : null}
              {canDeleteMessage(mobileActionMessage) ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleDeleteMessages([mobileActionMessage.id])}
                    className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 px-4 py-3 text-left text-sm font-medium text-rose-600"
                  >
                    <Trash2 className="size-4" />
                    Delete for everyone
                  </button>
                  <button
                    type="button"
                    onClick={() => enterSelectionMode(mobileActionMessage.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700"
                  >
                    <CheckCircle2 className="size-4" />
                    Select messages
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setMobileActionMessage(null)}
                className="flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportingMessage ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Report message</h3>
                <p className="mt-1 text-sm text-slate-500">Help us review spam, abuse, or inappropriate content.</p>
              </div>
              <button type="button" onClick={() => setReportingMessage(null)} className="rounded-full p-2 text-slate-500">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">{reportingMessage.user.name}</div>
              <div className="mt-1 line-clamp-3">{reportingMessage.content || reportingMessage.files?.[0]?.fileName || "Attachment"}</div>
            </div>

            <div className="mt-5 space-y-3">
              {reportOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setReportReason(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition",
                    reportReason === option.value ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  <span>{option.label}</span>
                  {reportReason === option.value ? <CheckCircle2 className="size-4" /> : null}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReportingMessage(null)}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReport()}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Submit report
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
