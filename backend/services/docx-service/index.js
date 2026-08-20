// docx-service/index.js - replace dengan yang ini

const express = require('express');
const cors = require('cors');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// ✅ Fungsi untuk mencari file di multiple path
function findTemplateFile(templatePath) {
  const possiblePaths = [
    templatePath, // original
    path.join(process.cwd(), templatePath), // relative to docx-service
    path.join(process.cwd(), '..', templatePath), // one level up
    path.join(process.cwd(), '../..', templatePath), // two levels up (ke backend/)
    path.join(process.cwd(), '../../..', templatePath), // three levels up
    // Path dengan nama file saja
    path.basename(templatePath),
    path.join(process.cwd(), 'uploads', 'templates', path.basename(templatePath)),
    path.join(process.cwd(), '..', 'uploads', 'templates', path.basename(templatePath)),
    path.join(process.cwd(), '../..', 'uploads', 'templates', path.basename(templatePath)),
  ];

  log('🔍 Searching for template in paths...');
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      log('✅ Found template at:', p);
      return p;
    }
  }

  log('❌ Template not found. Searched paths:', possiblePaths);
  return null;
}

app.post('/generate-docx', async (req, res) => {
  try {
    const { templatePath, data } = req.body;

    log('📄 Generating DOCX', { 
      templatePath, 
      dataKeys: Object.keys(data || {}) 
    });

    if (!templatePath) {
      return res.status(400).json({ message: 'Template path tidak ditemukan' });
    }

    // ✅ Cari file
    const fullPath = findTemplateFile(templatePath);

    if (!fullPath) {
      return res.status(400).json({ 
        message: 'Template file tidak ditemukan',
        requestedPath: templatePath,
        cwd: process.cwd()
      });
    }

    // Baca template
    const content = fs.readFileSync(fullPath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: function() { return ''; }
    });

    log('📝 Rendering template...');

    // Render dengan data
    doc.render(data);

    // Generate output
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    log('✅ DOCX generated successfully', { size: buffer.length });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);

  } catch (error) {
    console.error('❌ Error generating DOCX:', error);
    
    const errorResponse = {
      message: 'Gagal generate DOCX',
      error: error.message,
    };

    if (error.properties && error.properties.errors) {
      errorResponse.details = error.properties.errors.map(e => ({
        message: e.message,
        explanation: e.explanation,
        id: e.id,
        context: e.context,
      }));
    }

    if (error.stack) {
      errorResponse.stack = error.stack;
    }

    res.status(500).json(errorResponse);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`📄 DOCX Service running on port ${PORT}`);
  console.log(`📁 Current working directory: ${process.cwd()}`);
});