import { ProjectStatus, ProjectProjectType } from "@workspace/api-client-react";

export const getStatusLabel = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.draft: return "Draft";
    case ProjectStatus.site_selected: return "Site Selected";
    case ProjectStatus.analyzed: return "Analyzed";
    case ProjectStatus.programmed: return "Programmed";
    case ProjectStatus.images_generated: return "Images Generated";
    case ProjectStatus.complete: return "Complete";
    default: return status;
  }
};

export const getTypeLabel = (type: ProjectProjectType) => {
  switch (type) {
    case ProjectProjectType.residential: return "Residential";
    case ProjectProjectType.commercial: return "Commercial";
    case ProjectProjectType.cultural: return "Cultural";
    case ProjectProjectType.industrial: return "Industrial";
    case ProjectProjectType.mixed_use: return "Mixed Use";
    case ProjectProjectType.landscape: return "Landscape";
    default: return type;
  }
};

export const getStatusProgress = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.draft: return 10;
    case ProjectStatus.site_selected: return 30;
    case ProjectStatus.analyzed: return 50;
    case ProjectStatus.programmed: return 70;
    case ProjectStatus.images_generated: return 90;
    case ProjectStatus.complete: return 100;
    default: return 0;
  }
};
