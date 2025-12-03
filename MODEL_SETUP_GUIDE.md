# 📋 Complete Guide: Where to Place Face-API.js Model Files

## 🎯 Summary

**All model files go directly into:**
```
public/models/
```

**NOT in subfolders!** All 8 files should be in the same `models` folder.

---

## 📂 Exact Directory Structure

### Your Project Location:
```
C:\Users\ASUS\OneDrive\Desktop\visually-alike-build\
```

### Where Files Should Be:
```
C:\Users\ASUS\OneDrive\Desktop\visually-alike-build\public\models\
```

### Visual Structure:
```
visually-alike-build/
├── public/
│   ├── models/                          ← ALL FILES GO HERE
│   │   ├── tiny_face_detector_model-weights_manifest.json
│   │   ├── tiny_face_detector_model-shard1
│   │   ├── face_landmark_68_model-weights_manifest.json
│   │   ├── face_landmark_68_model-shard1
│   │   ├── face_recognition_model-weights_manifest.json
│   │   ├── face_recognition_model-shard1
│   │   ├── face_expression_model-weights_manifest.json
│   │   └── face_expression_model-shard1
│   ├── favicon.ico
│   └── ...
├── src/
├── server/
└── ...
```

---

## 📥 Step-by-Step: Method 1 (Manual Download)

### Step 1: Navigate to the Models Folder

1. Open **File Explorer** (Windows Explorer)
2. Navigate to:
   ```
   C:\Users\ASUS\OneDrive\Desktop\visually-alike-build\public\models
   ```
3. If the `models` folder doesn't exist, create it:
   - Right-click in `public` folder → New → Folder → Name it `models`

### Step 2: Download Each File

**For each link below:**
1. Right-click the link
2. Select "Save link as..." or "Save target as..."
3. **IMPORTANT:** Make sure you're saving to `public\models\` folder
4. Keep the original filename (don't rename)

#### Download These 8 Files:

**1. Tiny Face Detector:**
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

**2. Face Landmark 68:**
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1

**3. Face Recognition:**
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1

**4. Face Expression:**
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1

### Step 3: Verify Files

After downloading, open `public\models\` in File Explorer. You should see:

```
✅ tiny_face_detector_model-weights_manifest.json
✅ tiny_face_detector_model-shard1
✅ face_landmark_68_model-weights_manifest.json
✅ face_landmark_68_model-shard1
✅ face_recognition_model-weights_manifest.json
✅ face_recognition_model-shard1
✅ face_expression_model-weights_manifest.json
✅ face_expression_model-shard1
```

**Total: 8 files** (all directly in `models` folder, no subfolders)

---

## 📥 Step-by-Step: Method 2 (PowerShell Script)

### Step 1: Open PowerShell

1. Press `Windows Key + X`
2. Select "Windows PowerShell" or "Terminal"
3. Navigate to your project:
   ```powershell
   cd "C:\Users\ASUS\OneDrive\Desktop\visually-alike-build"
   ```

### Step 2: Run the Setup Script

```powershell
.\setup-face-api-models.ps1
```

**Note:** If the script doesn't find models in `node_modules`, you'll need to download manually (Method 1).

---

## 📥 Step-by-Step: Method 3 (Using Git)

### Step 1: Open Command Prompt or PowerShell

Navigate to your project:
```bash
cd "C:\Users\ASUS\OneDrive\Desktop\visually-alike-build"
```

### Step 2: Clone the Weights Repository

```bash
cd public
git clone https://github.com/justadudewhohacks/face-api.js.git temp-face-api
```

### Step 3: Copy Files to Models Folder

```powershell
# Create models folder if it doesn't exist
New-Item -ItemType Directory -Path "models" -Force

# Copy all model files
Copy-Item -Path "temp-face-api\weights\tiny_face_detector\*" -Destination "models\" -Force
Copy-Item -Path "temp-face-api\weights\face_landmark_68\*" -Destination "models\" -Force
Copy-Item -Path "temp-face-api\weights\face_recognition\*" -Destination "models\" -Force
Copy-Item -Path "temp-face-api\weights\face_expression\*" -Destination "models\" -Force

# Clean up
Remove-Item -Recurse -Force temp-face-api
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] All 8 files are in `public\models\` (not in subfolders)
- [ ] File names match exactly (case-sensitive)
- [ ] You can see both `.json` and `-shard1` files
- [ ] Total file count in `models` folder: 8 model files

### Quick Test:

1. Open browser
2. Go to: `http://localhost:8080/models/tiny_face_detector_model-weights_manifest.json`
3. You should see JSON content (not a 404 error)

---

## 🚨 Common Mistakes to Avoid

### ❌ WRONG:
```
public/
└── models/
    ├── tiny_face_detector/          ← DON'T CREATE SUBFOLDERS!
    │   └── files...
    └── face_landmark_68/            ← DON'T CREATE SUBFOLDERS!
        └── files...
```

### ✅ CORRECT:
```
public/
└── models/
    ├── tiny_face_detector_model-weights_manifest.json  ← All files here
    ├── tiny_face_detector_model-shard1               ← All files here
    ├── face_landmark_68_model-weights_manifest.json   ← All files here
    └── ... (all 8 files directly in models/)
```

---

## 🔍 How It Works

1. **Vite serves files from `public/` at root path**
   - `public/models/file.json` → accessible at `/models/file.json`

2. **face-api.js loads from `/models`**
   - Code uses: `loadFromUri("/models")`
   - This maps to: `public/models/` folder

3. **face-api.js automatically finds files**
   - It looks for files matching the model name pattern
   - Files must be in the same directory

---

## 📊 File Sizes Reference

| File | Approximate Size |
|------|------------------|
| `tiny_face_detector_model-weights_manifest.json` | ~1 KB |
| `tiny_face_detector_model-shard1` | ~190 KB |
| `face_landmark_68_model-weights_manifest.json` | ~1 KB |
| `face_landmark_68_model-shard1` | ~1.2 MB |
| `face_recognition_model-weights_manifest.json` | ~1 KB |
| `face_recognition_model-shard1` | ~5.4 MB |
| `face_expression_model-weights_manifest.json` | ~1 KB |
| `face_expression_model-shard1` | ~1.1 MB |
| **Total** | **~8 MB** |

---

## 🧪 Testing After Setup

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:**
   ```
   http://localhost:8080/facial-expression
   ```

3. **Expected behavior:**
   - Page loads
   - "Models Loaded" toast appears
   - "Start Detection" button is enabled
   - Camera feed works when clicked

4. **If models don't load:**
   - Check browser console (F12) for errors
   - Verify all 8 files are in `public/models/`
   - Check file names match exactly
   - Clear browser cache and reload

---

## 📞 Need Help?

- Check `public/models/SETUP_INSTRUCTIONS.md` for detailed troubleshooting
- Check `public/models/QUICK_START.md` for quick reference
- Verify file paths match this guide exactly

---

## 🎉 Success!

Once all 8 files are in `public/models/`, you're ready to use facial expression recognition!

