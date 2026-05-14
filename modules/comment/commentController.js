const Comment = require("./commentModel");
const Video = require("../video/videoModel");
const User = require("../user/userModel");

exports.addComment = async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.session.user.id;

    if (!content || content.trim() === "") {
        return res.status(400).json({ message: "O comentário não pode ser vazio." });
    }

    try {
        const comment = await Comment.create({
            content: content.trim(),
            userId,
            videoId
        });
        await Video.increment("commentsCount", { where: { id: videoId } });

        // Retorna o comentário com os dados do usuário para ser adicionado dinamicamente na UI
        const newComment = await Comment.findByPk(comment.id, {
            include: [{
                model: User,
                attributes: ["username", "fullName", "profilePicture"]
            }]
        });

        res.status(201).json({ message: "Comentário adicionado com sucesso!", comment: newComment });
    } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
        res.status(500).json({ message: "Erro interno do servidor ao adicionar comentário." });
    }
};

exports.getComments = async (req, res) => {
    const { videoId } = req.params;

    try {
        const comments = await Comment.findAll({
            where: { videoId },
            include: [{
                model: User,
                attributes: ["username", "fullName", "profilePicture"]
            }],
            order: [["createdAt", "DESC"]]
        });
        res.status(200).json({ comments });
    } catch (error) {
        console.error("Erro ao buscar comentários:", error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar comentários." });
    }
};
