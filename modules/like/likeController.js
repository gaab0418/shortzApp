const Like = require('./likeModel');
const Video = require('../video/videoModel');

exports.toggleLike = async (req, res) => {
    const { videoId } = req.params;
    const userId = req.session.user.id;

    try {
        const [like, created] = await Like.findOrCreate({
            where: { userId, videoId },
            defaults: { userId, videoId }
        });

        if (!created) {
            // Se já existia, remove o like (unlike)
            await like.destroy();
            await Video.decrement('likesCount', { where: { id: videoId } });
            return res.status(200).json({ liked: false, message: 'Unlike realizado com sucesso.' });
        } else {
            // Se foi criado, adiciona o like
            await Video.increment('likesCount', { where: { id: videoId } });
            return res.status(201).json({ liked: true, message: 'Like realizado com sucesso.' });
        }
    } catch (error) {
        console.error('Erro ao alternar like:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar like.' });
    }
};

exports.checkLikeStatus = async (req, res) => {
    const { videoId } = req.params;
    const userId = req.session.user.id;

    try {
        const like = await Like.findOne({ where: { userId, videoId } });
        res.status(200).json({ liked: !!like });
    } catch (error) {
        console.error('Erro ao verificar status do like:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao verificar status do like.' });
    }
};
