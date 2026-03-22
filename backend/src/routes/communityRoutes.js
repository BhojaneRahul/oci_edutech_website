import express from "express";
import {
  clearPersonalCommunityHistory,
  deleteCommunityMessages,
  getCommunityFile,
  getCommunityData,
  getCommunityGroups,
  getCommunityMessages,
  getCommunityReports,
  joinCommunityGroup,
  leaveCommunityGroup,
  muteCommunityNotifications,
  reactToCommunityMessage,
  reportCommunityMessage,
  sendCommunityMessage,
  submitTeacherVerification
  ,
  unmuteCommunityNotifications,
  uploadCommunityMessageFile
} from "../controllers/communityController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadCommunityChatFile, uploadTeacherId } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/groups", getCommunityGroups);
router.use(protect);
router.get("/", getCommunityData);
router.get("/:groupId/messages", getCommunityMessages);
router.get("/files/:id", getCommunityFile);
router.get("/reports", getCommunityReports);
router.post("/join", joinCommunityGroup);
router.post("/leave", leaveCommunityGroup);
router.post("/send", sendCommunityMessage);
router.post("/reply", sendCommunityMessage);
router.post("/upload", uploadCommunityChatFile.single("file"), uploadCommunityMessageFile);
router.post("/react", reactToCommunityMessage);
router.post("/report", reportCommunityMessage);
router.post("/clear", clearPersonalCommunityHistory);
router.post("/delete", deleteCommunityMessages);
router.post("/mute", muteCommunityNotifications);
router.post("/unmute", unmuteCommunityNotifications);
router.post("/teacher-verification", uploadTeacherId.single("idCard"), submitTeacherVerification);

export default router;
