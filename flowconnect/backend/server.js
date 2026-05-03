const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const initSocket = require("./socket/socket");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*" },
});

initSocket(io);

mongoose.connect("YOUR_MONGO_URI");

app.use(express.json());
app.use("/api/notifications", require("./routes/notifications"));

server.listen(5000, () => console.log("Server running"));