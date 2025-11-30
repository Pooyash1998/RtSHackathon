# PDF Export Aspect Ratio Preservation - Spec Update

## Overview
Updated the classroom-story-platform spec to ensure PDF exports maintain uniform scaling and preserve aspect ratios of comic panels regardless of the selected layout option (2 or 4 panels per page).

## Changes Made

### 1. Requirements Document (.kiro/specs/classroom-story-platform/requirements.md)
**Added Acceptance Criterion 7.6:**
- WHEN rendering panels in PDF THEN the Platform SHALL maintain uniform scaling and preserve the original aspect ratio of all comic panels regardless of selected layout option

### 2. Design Document (.kiro/specs/classroom-story-platform/design.md)

#### Added Correctness Property 21:
**Property 21: PDF panel aspect ratio preservation**
- *For any* exported story PDF with any layout option (2 or 4 panels per page), all rendered panels should maintain their original aspect ratio with uniform scaling applied consistently across all panels.
- **Validates: Requirements 7.6**

#### Updated ExportService Interface:
```python
class ExportService:
    async def generate_pdf(
        story: Story,
        panels: List[Panel],
        classroom: Classroom,
        layout: Literal["2", "4"] = "2",
        page_size: Literal["a4", "letter"] = "a4"
    ) -> bytes
    
    def calculate_panel_dimensions(
        self,
        page_width: float,
        page_height: float,
        panels_per_page: int,
        original_aspect_ratio: float
    ) -> Tuple[float, float]  # Returns (width, height) maintaining aspect ratio
```

#### Added PDF Layout Algorithm Specification:
- All panels maintain their original aspect ratio (typically square or 4:3)
- For 2 panels per page: Calculate max width/height that fits page while preserving aspect ratio
- For 4 panels per page: Arrange in 2x2 grid, scale uniformly to fit available space
- Apply consistent scaling factor across all panels in the document
- Center panels within their allocated space if aspect ratios differ from page layout

#### Updated API Models:
```python
class ExportPDFRequest(BaseModel):
    page_size: Literal["a4", "letter"] = "a4"
    layout: Literal["2", "4"] = "2"
    include_dialogue: bool = True
```

#### Updated Router Signatures:
```python
@router.get("/api/stories/{story_id}/export/pdf")
async def export_pdf_download(
    story_id: str,
    page_size: Literal["a4", "letter"] = "a4",
    layout: Literal["2", "4"] = "2",
    include_dialogue: bool = True
) -> FileResponse

@router.post("/api/stories/{story_id}/export/pdf")
async def export_pdf_url(story_id: str, request: ExportPDFRequest) -> ExportPDFResponse
```

### 3. Tasks Document (.kiro/specs/classroom-story-platform/tasks.md)

#### Updated Task 14.1:
Added implementation requirements:
- Implement uniform scaling logic that preserves aspect ratios across all layout options
- Calculate panel dimensions to maintain consistent aspect ratio regardless of 2 or 4 panels per page layout
- Updated requirements reference to include 7.6

#### Added Task 14.6:
- [ ]* 14.6 Write property test for PDF aspect ratio preservation
  - **Property 21: PDF panel aspect ratio preservation**
  - **Validates: Requirements 7.6**

## Implementation Guidance

### Key Algorithm Requirements:

1. **Determine Original Aspect Ratio:**
   - Fetch the first panel image to determine the original aspect ratio
   - Assume all panels have the same aspect ratio (standard for comic generation)

2. **Calculate Available Space:**
   - For A4: 210mm x 297mm (595pt x 842pt)
   - For Letter: 8.5" x 11" (612pt x 792pt)
   - Account for margins (e.g., 36pt on all sides)

3. **Layout-Specific Scaling:**
   
   **2 Panels Per Page:**
   - Stack vertically with spacing
   - Calculate max width: `available_width`
   - Calculate max height per panel: `(available_height - spacing) / 2`
   - Scale to fit: `min(max_width, max_height * aspect_ratio)`
   
   **4 Panels Per Page:**
   - Arrange in 2x2 grid
   - Calculate max width per panel: `(available_width - spacing) / 2`
   - Calculate max height per panel: `(available_height - spacing) / 2`
   - Scale to fit: `min(max_width, max_height * aspect_ratio)`

4. **Uniform Scaling:**
   - Calculate the scaling factor once based on the layout
   - Apply the same scaling factor to ALL panels
   - This ensures visual consistency throughout the document

5. **Centering:**
   - If a panel doesn't fill its allocated space, center it both horizontally and vertically
   - Maintain consistent spacing between panels

### ReportLab Implementation Example:

```python
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from PIL import Image

def calculate_panel_dimensions(page_width, page_height, layout, aspect_ratio):
    """Calculate uniform panel dimensions for the given layout."""
    margin = 36  # points
    spacing = 20  # points between panels
    
    available_width = page_width - (2 * margin)
    available_height = page_height - (2 * margin)
    
    if layout == "2":
        # 2 panels vertically
        max_height = (available_height - spacing) / 2
        max_width = available_width
    else:  # layout == "4"
        # 2x2 grid
        max_height = (available_height - spacing) / 2
        max_width = (available_width - spacing) / 2
    
    # Calculate dimensions maintaining aspect ratio
    if max_width / max_height > aspect_ratio:
        # Height is the limiting factor
        panel_height = max_height
        panel_width = panel_height * aspect_ratio
    else:
        # Width is the limiting factor
        panel_width = max_width
        panel_height = panel_width / aspect_ratio
    
    return panel_width, panel_height

def generate_pdf(story, panels, page_size="a4", layout="2", include_dialogue=True):
    """Generate PDF with uniform panel scaling."""
    # Get page dimensions
    page_dims = A4 if page_size == "a4" else LETTER
    page_width, page_height = page_dims
    
    # Determine aspect ratio from first panel
    first_image = Image.open(download_image(panels[0].image_url))
    aspect_ratio = first_image.width / first_image.height
    
    # Calculate uniform panel dimensions
    panel_width, panel_height = calculate_panel_dimensions(
        page_width, page_height, layout, aspect_ratio
    )
    
    # Create PDF with consistent scaling
    c = canvas.Canvas(output_path, pagesize=page_dims)
    
    # ... render panels using panel_width and panel_height for ALL panels
```

## Testing Requirements

### Property-Based Test (Task 14.6):
```python
from hypothesis import given, strategies as st
import pytest

@given(
    layout=st.sampled_from(["2", "4"]),
    page_size=st.sampled_from(["a4", "letter"]),
    num_panels=st.integers(min_value=1, max_value=20)
)
def test_pdf_aspect_ratio_preservation(layout, page_size, num_panels):
    """
    Feature: classroom-story-platform, Property 21: PDF panel aspect ratio preservation
    
    For any layout and page size, all panels in the PDF should:
    1. Maintain their original aspect ratio
    2. Have uniform dimensions (all panels same size)
    3. Fit within the page boundaries
    """
    # Generate test story with panels
    story, panels = create_test_story(num_panels)
    
    # Generate PDF
    pdf_bytes = export_service.generate_pdf(
        story, panels, page_size=page_size, layout=layout
    )
    
    # Parse PDF and extract panel dimensions
    panel_dimensions = extract_panel_dimensions_from_pdf(pdf_bytes)
    
    # Verify all panels have the same dimensions (uniform scaling)
    assert len(set(panel_dimensions)) == 1, "All panels must have uniform dimensions"
    
    # Verify aspect ratio is preserved
    original_aspect = get_original_aspect_ratio(panels[0])
    rendered_width, rendered_height = panel_dimensions[0]
    rendered_aspect = rendered_width / rendered_height
    
    assert abs(rendered_aspect - original_aspect) < 0.01, \
        f"Aspect ratio not preserved: {rendered_aspect} vs {original_aspect}"
```

## Frontend Integration

The existing StoryViewer component already has the UI for export settings. When implementing task 14.2 (Create export router), ensure the frontend passes these settings:

```typescript
const handleExport = async () => {
  try {
    const response = await fetch(
      `/api/stories/${storyId}/export/pdf?` + 
      `page_size=${exportSettings.pageSize}&` +
      `layout=${exportSettings.layout}&` +
      `include_dialogue=${exportSettings.includeDialogue === 'yes'}`
    );
    
    const blob = await response.blob();
    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title}.pdf`;
    a.click();
    
    toast.success("PDF downloaded successfully!");
  } catch (error) {
    toast.error("Failed to generate PDF. Please try again.");
  }
};
```

## Summary

The spec has been updated to ensure that regardless of whether a teacher chooses 2 or 4 panels per page, or A4 vs Letter size, all comic panels will:

1. ✅ Maintain their original aspect ratio (no stretching or squashing)
2. ✅ Be scaled uniformly (all panels the same size within the document)
3. ✅ Be properly centered and spaced on the page
4. ✅ Provide a consistent, professional reading experience

This ensures the exported PDFs maintain the visual quality and consistency of the original comic panels, making them suitable for classroom printing and distribution.
