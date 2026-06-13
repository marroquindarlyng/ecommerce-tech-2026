const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const uploadRoot = path.resolve(__dirname, '../uploads/productos');
const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
]);

fs.mkdirSync(uploadRoot, { recursive: true });

const cleanName = (name) => String(name || 'producto')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'producto';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadRoot),
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const basename = cleanName(path.basename(file.originalname || 'producto', extension));
        cb(null, `${Date.now()}-${basename}${extension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error('Solo se permiten imagenes JPG, PNG, WEBP o GIF'));
        }

        cb(null, true);
    }
});

const isStaffRequest = (req) => ['admin', 'vendedor'].includes(String(req.header('x-user-role') || '').toLowerCase());

router.post('/api/uploads/productos', (req, res) => {
    if (!isStaffRequest(req)) {
        return res.status(403).json({
            estado: 'ERROR',
            mensaje: 'No tienes permisos para subir imagenes de producto'
        });
    }

    upload.single('imagen')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                estado: 'ERROR',
                mensaje: err.message || 'No se pudo subir la imagen'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                estado: 'ERROR',
                mensaje: 'Debes seleccionar una imagen'
            });
        }

        res.status(201).json({
            estado: 'OK',
            mensaje: 'Imagen cargada correctamente',
            data: {
                filename: req.file.filename,
                url: `/uploads/productos/${req.file.filename}`
            }
        });
    });
});

module.exports = router;
