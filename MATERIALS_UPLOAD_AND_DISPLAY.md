# Materials Upload and Display - Complete Implementation

## Overview
Implemented full materials management system for classrooms, including:
- Upload PDF materials to Supabase "Materials" bucket
- Store material metadata in database
- Display existing materials
- Delete materials

## Database Structure

### Materials Table
```sql
CREATE TABLE public.materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id uuid NOT NULL REFERENCES classrooms(id),
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    file_type text NOT NULL,
    week_number integer,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

## Backend Implementation

### 1. Database Functions (`backend/src/database/database.py`)

#### create_material()
- Creates material record in database
- Stores file URL, title, description, week number
- Returns created material

#### get_materials_by_classroom()
- Fetches all materials for a classroom
- Orders by created_at (newest first)
- Returns list of materials

#### get_material()
- Gets single material by ID
- Returns material record or None

#### delete_material()
- Deletes material from database
- Returns success boolean

### 2. API Endpoints (`backend/src/main.py`)

#### GET /classrooms/{classroom_id}/materials
**Purpose**: Fetch all materials for a classroom

**Returns**:
```json
{
  "success": true,
  "materials": [
    {
      "id": "...",
      "classroom_id": "...",
      "title": "Week 3: Newton's Laws",
      "description": "Study materials for Newton's Laws",
      "file_url": "https://...supabase.co/storage/v1/object/public/Materials/...",
      "file_type": "application/pdf",
      "week_number": 3,
      "created_at": "2024-11-29T..."
    }
  ]
}
```

#### POST /classrooms/{classroom_id}/materials/upload
**Purpose**: Upload a new material file

**Parameters**:
- `file`: PDF file (multipart/form-data)
- `title`: Material title (required)
- `description`: Optional description
- `week_number`: Optional week number

**Process**:
1. Validates classroom exists
2. Validates file type (PDF only)
3. Validates file size (max 50MB)
4. Uploads to Supabase "Materials" bucket
5. Creates database record
6. Returns material record

**Storage Path**: `{classroom_id}/{uuid}.pdf`

**Returns**:
```json
{
  "success": true,
  "material": { ...material record... }
}
```

#### DELETE /materials/{material_id}
**Purpose**: Delete a material

**Process**:
1. Fetches material record
2. Deletes file from Supabase storage
3. Deletes database record
4. Returns success message

## Frontend Implementation

### 1. API Client (`frontend/src/lib/api.ts`)

#### getMaterials(classroomId)
- Fetches all materials for classroom
- Returns array of materials

#### uploadMaterial(classroomId, file, title, description, weekNumber)
- Uploads material file
- Uses FormData for multipart upload
- Returns created material

#### deleteMaterial(materialId)
- Deletes material
- Returns success message

### 2. Teacher Classroom Detail (`frontend/src/pages/teacher/ClassroomDetail.tsx`)

#### State Management
```typescript
const [uploadedMaterials, setUploadedMaterials] = useState<any[]>([]);
const [materials, setMaterials] = useState<MaterialFile[]>([]);
const [isUploading, setIsUploading] = useState(false);
```

- `uploadedMaterials`: Existing materials from database
- `materials`: New materials being prepared for upload
- `isUploading`: Upload in progress flag

#### Data Fetching
```typescript
// Fetch materials on component mount
const materialsResponse = await api.classrooms.getMaterials(id);
setUploadedMaterials(materialsResponse.materials);
```

#### Upload Handler
```typescript
const handleUploadMaterials = async () => {
  // Validate titles
  // Upload each material
  // Show success toast
  // Clear materials list
  // Refresh uploaded materials
};
```

## UI Features

### Materials Tab Layout

#### 1. Upload Area
- Drag & drop zone for PDF files
- Click to browse files
- Shows "Max 50MB per file • PDF only"
- Visual feedback when dragging

#### 2. Existing Materials Section
**Shows when materials exist**:
- Title: "Existing Materials (N)"
- List of uploaded materials
- Each material shows:
  - 📄 PDF icon
  - Title
  - Description (if provided)
  - Upload date
  - "View" button (opens in new tab)
  - Delete button (with confirmation)

#### 3. New Materials Section
**Shows when files are selected**:
- Title: "New Materials to Upload (N)"
- List of files to upload
- Each file shows:
  - File name
  - File size
  - Title input (required)
  - Description textarea (optional)
  - Remove button
- "Upload N Material(s)" button at bottom

### User Flow

```
1. Teacher opens classroom → Materials tab
2. Sees existing materials (if any)
3. Drags/selects PDF files
4. Files appear in "New Materials" section
5. Fills in title and description for each
6. Clicks "Upload N Materials"
7. Shows loading state
8. Materials upload to Supabase
9. Success toast appears
10. New materials list clears
11. Existing materials refreshes
12. New materials appear in "Existing Materials"
```

## Storage Structure

### Supabase "Materials" Bucket

**Path Format**: `{classroom_id}/{uuid}.pdf`

**Example**:
```
Materials/
  ├── 942f3ae3-1dbd-4b7c-afd3-135b3e386de1/
  │   ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf
  │   ├── b2c3d4e5-f6g7-8901-bcde-f12345678901.pdf
  │   └── ...
  ├── another-classroom-id/
  │   └── ...
```

**Benefits**:
- Organized by classroom
- Unique filenames prevent conflicts
- Easy to manage per-classroom
- Automatic cleanup possible

## Validation

### Backend Validation
- ✅ Classroom exists
- ✅ File type is PDF
- ✅ File size ≤ 50MB
- ✅ Title is provided

### Frontend Validation
- ✅ Title is not empty
- ✅ File type is PDF (input accept)
- ✅ Confirmation before delete

## Error Handling

### Upload Errors
- Invalid file type → "Only PDF files are allowed"
- File too large → "File too large: X bytes. Max: 50MB"
- Missing title → "Please provide a title for {filename}"
- Storage error → "Supabase upload failed"
- Network error → "Failed to upload materials"

### Delete Errors
- Material not found → 404 error
- Storage deletion fails → Continues with database deletion
- Network error → "Failed to delete material"

## Security

### File Validation
- Only PDF files accepted
- File size limited to 50MB
- Content-type validation

### Access Control
- Materials scoped to classroom
- Public URLs (consider adding auth later)
- Organized by classroom ID

## Testing

### Test Upload
1. Go to classroom → Materials tab
2. Drag a PDF file
3. Fill in title: "Test Material"
4. Fill in description: "Test description"
5. Click "Upload 1 Material"
6. **Expected**: Success toast, material appears in "Existing Materials"

### Test View
1. Click "View" on a material
2. **Expected**: PDF opens in new tab

### Test Delete
1. Click delete (X) button
2. Confirm deletion
3. **Expected**: Material removed from list

### Test Multiple Upload
1. Select 3 PDF files
2. Fill in titles for all
3. Click "Upload 3 Materials"
4. **Expected**: All upload, appear in existing materials

## Benefits

### ✅ Complete Material Management
- Upload, view, delete materials
- All in one place
- Organized by classroom

### ✅ User-Friendly
- Drag & drop support
- Clear visual feedback
- Loading states
- Success/error messages

### ✅ Scalable
- Organized storage structure
- Efficient database queries
- Handles multiple files

### ✅ Reliable
- Comprehensive validation
- Error handling
- Confirmation dialogs

## Future Enhancements

### Optional Features:
1. **Week organization**: Group materials by week_number
2. **Search/filter**: Search materials by title
3. **Bulk delete**: Delete multiple materials at once
4. **File preview**: Preview PDF in modal
5. **Download**: Download materials
6. **Sharing**: Share materials with students
7. **Access control**: Private materials
8. **File types**: Support more file types (images, videos)
9. **Versioning**: Upload new versions of materials
10. **Tags**: Tag materials for organization

## Summary

Teachers can now:
- ✅ Upload PDF materials to their classroom
- ✅ View all existing materials
- ✅ Delete materials they no longer need
- ✅ Organize materials with titles and descriptions
- ✅ Materials stored permanently in Supabase

All materials are stored in the "Materials" bucket and organized by classroom! 🎉
