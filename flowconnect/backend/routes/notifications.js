const router = require("express").Router();
const Notification = require("../models/Notification");

// GET all notifications
router.get("/:userId", async (req, res) => {
  const data = await Notification.find({ userId: req.params.userId })
    .sort({ createdAt: -1 });

  res.json(data);
});

// MARK as read
router.put("/:id/read", async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true,
  });
  res.send("Marked as read");
});

module.exports = router;