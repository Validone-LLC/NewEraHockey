# Video Gallery Data

Add Instagram video JSON files to this directory to display them in the gallery.

## How to Add a Video

1. Copy an Instagram reel/post URL from `@newerahockeytrainingdmv`
2. Create a new JSON file (e.g., `camp-highlights-2024.json`)
3. Use this schema:

```json
{
  "id": "unique-id",
  "type": "instagram",
  "instagramUrl": "https://www.instagram.com/reel/ABC123/",
  "title": "Video Title",
  "category": "camps",
  "featured": true,
  "order": 1
}
```

## Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g., "camp-2024-01") |
| `type` | Yes | Must be "instagram" |
| `instagramUrl` | Yes | Full Instagram reel/post URL |
| `title` | No | Display title for the video |
| `category` | No | "camps", "highlights", or "tutorials" |
| `featured` | No | `true` to highlight this video |
| `order` | No | Sort order (lower = first) |

## Categories

- `camps` - Training camp videos
- `highlights` - Player highlights and game footage
- `tutorials` - Instructional/tutorial content

## Example Files

**camp-highlights-2024.json**
```json
{
  "id": "camp-highlights-2024",
  "type": "instagram",
  "instagramUrl": "https://www.instagram.com/reel/C1234abcd/",
  "title": "Summer Camp 2024 Highlights",
  "category": "camps",
  "featured": true,
  "order": 1
}
```

**skating-drill.json**
```json
{
  "id": "skating-drill-01",
  "type": "instagram",
  "instagramUrl": "https://www.instagram.com/p/C5678efgh/",
  "title": "Crossover Skating Drill",
  "category": "tutorials",
  "featured": false,
  "order": 10
}
```

Videos will automatically appear in the gallery after adding JSON files - no code changes needed!
