import express from 'express';
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ status: 'desativado', mensagem: 'WhatsApp temporariamente desativado' });
});

export default router;