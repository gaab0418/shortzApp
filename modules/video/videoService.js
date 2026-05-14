const Video = require("./videoModel");
const User = require("../user/userModel");
const Like = require("../like/likeModel");
const fs = require("fs");
const path = require("path");
const sequelize = require("sequelize");

async function uploadVideo(title, description, videoFile, thumbnailFile, userId) {
  if (!videoFile || !thumbnailFile) {
    throw new Error("Por favor, envie o vídeo e a capa.");
  }

  const newVideo = await Video.create({
    title,
    description,
    videoPath: videoFile.filename,
    thumbnailPath: thumbnailFile.filename,
    userId,
  });

  await User.increment("videosCount", { where: { id: userId } });

  return newVideo;
}

async function streamVideo(videoId) {
  const video = await Video.findByPk(videoId);
  if (!video) {
    throw new Error("Vídeo não encontrado.");
  }

  return video;
}

async function getAllVideos() {
  const videos = await Video.findAll({
    include: [{
      model: User,
      attributes: ["id", "username", "fullName", "profilePicture"]
    }],
    order: [["createdAt", "DESC"]],
    limit: 20
  });
  return videos;
}

async function getVideoDetails(videoId, currentUserId = null) {
  const video = await Video.findByPk(videoId, {
    include: [{
      model: User,
      attributes: ["id", "username", "fullName", "profilePicture"]
    }],
    attributes: {
      include: [
        [sequelize.literal("(SELECT COUNT(*) FROM `likes` WHERE `likes`.`videoId` = `Video`.`id`)"), "likesCount"],
        [sequelize.literal("(SELECT COUNT(*) FROM `comments` WHERE `comments`.`videoId` = `Video`.`id`)"), "commentsCount"]
      ]
    }
  });

  if (!video) {
    throw new Error("Vídeo não encontrado.");
  }

  await video.increment("views");
  video.views += 1;

  let isLiked = false;
  if (currentUserId) {
    const existingLike = await Like.findOne({ where: { userId: currentUserId, videoId } });
    isLiked = !!existingLike;
  }

  return { video, isLiked };
}

module.exports = {
  uploadVideo,
  streamVideo,
  getAllVideos,
  getVideoDetails
};
