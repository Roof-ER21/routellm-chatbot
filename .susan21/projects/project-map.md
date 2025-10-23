# Project Map & Consolidation Plan

## Active Main Projects ✅

### 1. Susan 21 AI (Primary)
**Location**: /Users/a21/Desktop/routellm-chatbot-railway
**Status**: ACTIVE - Main production system
**Keep**: YES

### 2. ROOF-ER Leaderboard
**Location**: /Users/a21/Downloads/ROOF-ER-Leaderboard 3
**Status**: ACTIVE - Production app
**Keep**: YES

### 3. Susan/Agnes Demo
**Location**: /Users/a21/susan-agnes-demo
**Status**: ACTIVE - Testing/demo
**Keep**: YES

### 4. Training Materials
**Location**: /Users/a21/Desktop/Training Leaders Main
**Status**: ACTIVE - Knowledge base
**Keep**: YES

### 5. HR Management System
**Location**: /Users/a21/hr-management-system
**Status**: IN DEVELOPMENT
**Keep**: YES

## Backup/Duplicate Projects 📦

### Susan 21 Backups (Can Archive)
- /Users/a21/routellm-chatbot-backup-20251002-013010
- /Users/a21/repo-routellm-chatbot
- /Users/a21/routellm-chatbot
**Action**: Archive to external drive or delete (already have main at Desktop/routellm-chatbot-railway)

### Training Leaders Duplicates
- /Users/a21/training-leaders-main (appears to be duplicate of Desktop/Training Leaders Main)
**Action**: Compare and merge unique content, then delete

## Other Projects 🔍

### 1099 Hub
**Location**: /Users/a21/1099-hub-main
**Status**: Unknown purpose
**Action**: Review if related to HR system, otherwise archive

### Web App
**Location**: /Users/a21/web-app
**Status**: Generic name, unclear purpose
**Action**: Identify purpose or delete

### RoofTrack Railway
**Location**: /Users/a21/rooftrack-railway
**Status**: Possibly old version of tracking app
**Action**: Check if superseded by Leaderboard app

### RoofER Presentation
**Location**: /Users/a21/RoofER_Presentation_1
**Status**: Demo/presentation app
**Action**: Keep if used for demos, otherwise archive

### Rufus 3D Avatar
**Location**: /Users/a21/Rufus-3D-Avatar-Production
**Status**: 3D avatar project
**Action**: Keep if planning to use, otherwise archive

## Advanced Capabilities 🚀

### Open Computer Use
**Location**: /Users/a21/Downloads/open-computer-use
**Status**: NEWLY INSTALLED
**Purpose**: Autonomous computer automation
**Keep**: YES

### FullstackAgent
**Location**: /Users/a21/Downloads/FullstackAgent
**Status**: NEWLY INSTALLED
**Purpose**: Kubernetes sandbox environments
**Keep**: YES

## Consolidation Actions

### Priority 1: Remove Backups
```bash
# Archive or delete Susan 21 backups
rm -rf /Users/a21/routellm-chatbot-backup-20251002-013010
rm -rf /Users/a21/repo-routellm-chatbot
rm -rf /Users/a21/routellm-chatbot
```

### Priority 2: Merge Training Content
```bash
# Compare directories
diff -r "/Users/a21/Desktop/Training Leaders Main" /Users/a21/training-leaders-main

# Copy unique files if any, then delete duplicate
rm -rf /Users/a21/training-leaders-main
```

### Priority 3: Identify Unknown Projects
Review each project's package.json and README to determine:
- Is it currently used?
- Does it relate to main projects?
- Can it be archived/deleted?

## Recommended Final Structure

```
/Users/a21/
├── Desktop/
│   ├── routellm-chatbot-railway/     (Susan 21 AI - Main)
│   └── Training Leaders Main/        (Training materials)
├── Downloads/
│   ├── ROOF-ER-Leaderboard 3/       (Leaderboard app)
│   ├── open-computer-use/            (Computer automation)
│   └── FullstackAgent/               (K8s sandboxes)
├── susan-agnes-demo/                 (Demo/testing)
├── hr-management-system/             (HR app in dev)
└── [archive]/                        (Move old projects here)
    ├── 1099-hub-main/
    ├── web-app/
    ├── rooftrack-railway/
    └── RoofER_Presentation_1/
```

## Storage Savings

Estimated space to recover:
- Susan 21 backups: ~2-3 GB
- Duplicate training: ~500 MB
- Unused projects: ~1-2 GB
**Total**: ~4-6 GB

## Next Steps

1. Create archive directory: `mkdir ~/archive`
2. Move questionable projects to archive
3. Test main projects still work
4. Delete old backups after confirming
5. Update ~/CLAUDE.md with final project structure
