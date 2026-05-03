let users = {};

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userId) => {
      users[userId] = socket.id;
    });

    socket.on("send_notification", ({ receiverId, notification }) => {
      const socketId = users[receiverId];

      if (socketId) {
        io.to(socketId).emit("receive_notification", notification);
      }
    });

    socket.on("disconnect", () => {
      Object.keys(users).forEach((userId) => {
        if (users[userId] === socket.id) {
          delete users[userId];
        }
      });
    });
  });
};

module.exports = initSocket;