import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// API 라우트
app.use(router);

// 프로덕션: Vite 빌드 결과물 서빙
// dist-server/server/index.js → 프로젝트 루트의 dist/
const distPath = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(distPath));

// SPA 폴백: API가 아닌 모든 경로를 index.html로
app.get('/{*splat}', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
    return;
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
