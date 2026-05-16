(function () {
  "use strict";

  var STORAGE_KEY = "contentpilot.workspace.v1";
  var MAX_UNDO = 25;
  var STAGES = ["Idea", "Research", "Script", "Recording", "Editing", "Thumbnail", "Review", "Sponsor Approval", "Scheduled", "Published"];
  var ROUTES = [
    { id: "dashboard", title: "Command Dashboard", eyebrow: "Operational Pulse", desc: "Health, deadlines, bottlenecks, and momentum." },
    { id: "pipeline", title: "Content Pipeline", eyebrow: "Production Flow", desc: "Move content from raw idea to publish-ready." },
    { id: "viral", title: "Viral Opportunity Engine", eyebrow: "Scoring Studio", desc: "Evaluate hooks, titles, CTAs, retention, and fit." },
    { id: "hooks", title: "Hook Laboratory", eyebrow: "Creative Testing", desc: "Generate, score, favorite, and save opening angles." },
    { id: "scripts", title: "Script Studio", eyebrow: "Narrative Engineering", desc: "Shape pacing, structure, proof, and CTA clarity." },
    { id: "thumbnail", title: "Thumbnail Strategy Engine", eyebrow: "Packaging Direction", desc: "Plan attention and clarity before design." },
    { id: "repurpose", title: "Repurposing Center", eyebrow: "Distribution Design", desc: "Adapt one asset for multiple platforms." },
    { id: "campaigns", title: "Campaign Command Center", eyebrow: "Launch Control", desc: "Manage launch waves, offers, and sequences." },
    { id: "sponsors", title: "Sponsor Operations Center", eyebrow: "Revenue Delivery", desc: "Track deliverables, approvals, and payments." },
    { id: "calendar", title: "Content Calendar", eyebrow: "Publishing Rhythm", desc: "See schedule gaps, overload, and platform balance." },
    { id: "team", title: "Team Workspace", eyebrow: "Execution Alignment", desc: "Approvals, notes, assignments, and blockers." },
    { id: "vault", title: "Swipe Vault", eyebrow: "Knowledge System", desc: "Store hooks, CTAs, titles, concepts, and prompts." },
    { id: "reports", title: "Reports & Export Center", eyebrow: "Client-Ready Output", desc: "Generate local HTML reports and backups." },
    { id: "settings", title: "Workspace Settings", eyebrow: "System Control", desc: "Theme, backups, onboarding, and reset." }
  ];
  var PLATFORMS = ["YouTube", "Shorts", "TikTok", "Instagram Reel", "Carousel", "LinkedIn Post", "Email Teaser"];
  var PLATFORM_GUIDES = {
    YouTube: { duration: "8-14 min", cta: "Drive to full episode, offer, or newsletter", risk: "Slow starts and generic titles hurt CTR." },
    Shorts: { duration: "25-45 sec", cta: "Push to part two or long-form episode", risk: "Front-loaded payoff is mandatory." },
    TikTok: { duration: "20-40 sec", cta: "Comment-based CTA or link-in-bio angle", risk: "Over-produced intros reduce completion." },
    "Instagram Reel": { duration: "20-35 sec", cta: "Save/share CTA outperforms website ask", risk: "Visual repetition lowers hold rate." },
    Carousel: { duration: "6-9 slides", cta: "Swipe to framework, end on save CTA", risk: "Dense text reduces slide depth." },
    "LinkedIn Post": { duration: "180-320 words", cta: "Invite discussion with a specific tension", risk: "Overly creator-centric language underperforms." },
    "Email Teaser": { duration: "90-140 words", cta: "Open loop toward full asset or offer", risk: "Subject and preview text must earn the click." }
  };

  var els = {
    body: document.body,
    appView: document.getElementById("appView"),
    routeTitle: document.getElementById("routeTitle"),
    routeEyebrow: document.getElementById("routeEyebrow"),
    sidebarNav: document.getElementById("sidebarNav"),
    sidebarPulse: document.getElementById("sidebarPulse"),
    miniActivity: document.getElementById("miniActivity"),
    globalSearch: document.getElementById("globalSearch"),
    assigneeFilter: document.getElementById("assigneeFilter"),
    modalBackdrop: document.getElementById("modalBackdrop"),
    modalTitle: document.getElementById("modalTitle"),
    modalEyebrow: document.getElementById("modalEyebrow"),
    modalBody: document.getElementById("modalBody"),
    paletteBackdrop: document.getElementById("paletteBackdrop"),
    paletteSearch: document.getElementById("paletteSearch"),
    paletteResults: document.getElementById("paletteResults"),
    notificationDrawer: document.getElementById("notificationDrawer"),
    notificationList: document.getElementById("notificationList"),
    walkthrough: document.getElementById("walkthrough"),
    walkthroughTitle: document.getElementById("walkthroughTitle"),
    walkthroughBody: document.getElementById("walkthroughBody"),
    importInput: document.getElementById("importInput"),
    toastStack: document.getElementById("toastStack")
  };

  var state = loadState();
  var ui = {
    route: getInitialRoute(),
    viewFilter: "all",
    assigneeFilter: "all",
    search: "",
    paletteSearch: "",
    selectedContentId: "",
    selectedCampaignId: "",
    selectedSponsorId: "",
    selectedScriptId: "",
    selectedHookDraft: "",
    notificationOpen: false,
    walkthroughStep: 0,
    dragContentId: "",
    pendingImport: null,
    generatedHookIdeas: [],
    dashboardInsightGroup: "",
    dashboardFeed: "all",
    dashboardQueueView: "readiness"
  };
  var undoStack = [];
  var walkthroughSteps = [
    {
      title: "ContentPilot is built to run locally without compromise.",
      body: "Every module persists with localStorage, every export works offline, and the demo workspace is designed to show immediate business value."
    },
    {
      title: "Use the pipeline as your production command center.",
      body: "Drag content through real production stages, surface blockers, and let dashboards and alerts update from live workspace state."
    },
    {
      title: "Score quality before you schedule anything.",
      body: "Hooks, scripts, thumbnail plans, readiness, sponsor risk, and repurposing advice all work as local decision tools."
    }
  ];

  init();

  function init() {
    state = normalizeWorkspace(state);
    ensureSelections();
    bindEvents();
    applyTheme();
    render();
    maybeStartWalkthrough();
  }

  function bindEvents() {
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    window.addEventListener("hashchange", function () {
      ui.route = getInitialRoute();
      render();
    });
    els.globalSearch.addEventListener("input", function (event) {
      ui.search = event.target.value.trim().toLowerCase();
      render();
    });
    els.assigneeFilter.addEventListener("change", function (event) {
      ui.assigneeFilter = event.target.value;
      render();
    });
    els.paletteSearch.addEventListener("input", function (event) {
      ui.paletteSearch = event.target.value.trim().toLowerCase();
      renderPalette();
    });
    els.importInput.addEventListener("change", handleImportFile);
    els.modalBackdrop.addEventListener("click", function (event) {
      if (event.target === els.modalBackdrop) closeModal();
    });
    els.paletteBackdrop.addEventListener("click", function (event) {
      if (event.target === els.paletteBackdrop) closePalette();
    });
    els.notificationDrawer.addEventListener("click", function (event) {
      if (event.target === els.notificationDrawer) closeNotifications();
    });
  }

  function handleClick(event) {
    var routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      window.location.hash = routeButton.getAttribute("data-route");
      return;
    }
    var paletteItem = event.target.closest("[data-palette-action]");
    if (paletteItem) {
      runPaletteAction(paletteItem.getAttribute("data-palette-action"), paletteItem.getAttribute("data-value"));
      return;
    }
    var actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    var action = actionButton.getAttribute("data-action");
    var id = actionButton.getAttribute("data-id");
    var value = actionButton.getAttribute("data-value");

    if (action === "set-view") {
      ui.viewFilter = value || "all";
      render();
    } else if (action === "toggle-theme") {
      mutate("Theme updated", function () {
        state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
      }, { quiet: true });
      applyTheme();
      render();
    } else if (action === "open-palette") openPalette();
    else if (action === "close-palette") closePalette();
    else if (action === "open-notifications") openNotifications();
    else if (action === "close-notifications") closeNotifications();
    else if (action === "open-shortcuts") openShortcutsModal();
    else if (action === "undo") performUndo();
    else if (action === "open-quick-add") openQuickAddModal();
    else if (action === "close-modal") closeModal();
    else if (action === "quick-add-type") openQuickCreateForm(value);
    else if (action === "open-content") { if (id) ui.selectedContentId = id; openContentModal(id || ""); }
    else if (action === "open-hook-builder") openHookBuilderModal(id);
    else if (action === "toggle-favorite-hook") toggleFavoriteHook(id);
    else if (action === "load-hook-draft") loadHookDraft(id);
    else if (action === "open-script-editor") openScriptEditor(id || ui.selectedScriptId);
    else if (action === "open-thumbnail-planner") openThumbnailPlanner(id || ui.selectedContentId);
    else if (action === "open-campaign") { if (id) ui.selectedCampaignId = id; openCampaignModal(id || ""); }
    else if (action === "open-sponsor") { if (id) ui.selectedSponsorId = id; openSponsorModal(id || ""); }
    else if (action === "open-team-note") openTeamNoteModal(id);
    else if (action === "open-vault-item") openVaultModal(id);
    else if (action === "export-report") exportReport(value || id || "strategy");
    else if (action === "open-report-export") window.location.hash = "reports";
    else if (action === "export-json") exportWorkspaceJson();
    else if (action === "import-json") els.importInput.click();
    else if (action === "apply-import") applyPendingImport();
    else if (action === "reset-workspace") {
      openConfirmModal("Reset workspace", "This will remove current ContentPilot data and restore the seeded demo workspace.", "Reset Workspace", function () {
        undoStack = [];
        state = normalizeWorkspace(createSeedState());
        saveState();
        ensureSelections();
        render();
        closeModal();
        toast("Workspace reset", "Seeded demo data has been restored.");
      });
    } else if (action === "reset-onboarding") {
      mutate("Onboarding reset", function () {
        state.settings.onboardingComplete = false;
      }, { quiet: true });
      maybeStartWalkthrough(true);
      render();
    } else if (action === "advance-walkthrough") advanceWalkthrough();
    else if (action === "skip-walkthrough") finishWalkthrough();
    else if (action === "dismiss-toast") dismissToast(id);
    else if (action === "set-selected-content") { ui.selectedContentId = id; render(); }
    else if (action === "set-selected-script") { ui.selectedScriptId = id; render(); }
    else if (action === "set-selected-campaign") { ui.selectedCampaignId = id; render(); }
    else if (action === "set-selected-sponsor") { ui.selectedSponsorId = id; render(); }
    else if (action === "toggle-approval") updateApproval(id);
    else if (action === "toggle-payment") updateSponsorPayment(id);
    else if (action === "complete-note") toggleTeamNote(id);
    else if (action === "duplicate-hook") duplicateHookIntoVault(id);
    else if (action === "create-report-from-content") exportContentPlanForContent(id);
    else if (action === "clear-search") clearAllFilters();
    else if (action === "archive-notification") archiveNotification(id);
    else if (action === "apply-insight-action") applyInsightAction(id, value);
    else if (action === "jump-content-route") {
      if (id) ui.selectedContentId = id;
      if (value) window.location.hash = value;
      else render();
    }
    else if (action === "save-viral-result") saveViralResultToContent(id);
    else if (action === "build-hook-ideas") generateHookIdeasForSelected();
    else if (action === "load-generated-hook") loadGeneratedHook(Number(id || 0));
    else if (action === "save-generated-hook") saveGeneratedHookByIndex(Number(id || 0));
    else if (action === "delete-content") confirmDeleteContent(id);
    else if (action === "delete-hook") confirmDeleteHook(id);
    else if (action === "delete-script") confirmDeleteScript(id);
    else if (action === "delete-campaign") confirmDeleteCampaign(id);
    else if (action === "delete-sponsor") confirmDeleteSponsor(id);
    else if (action === "delete-note") confirmDeleteNote(id);
    else if (action === "delete-vault") confirmDeleteVault(id);
    else if (action === "copy-repurpose") copyRepurposeAngle(value);
    else if (action === "save-repurpose") saveRepurposeAngle(value);
    else if (action === "toggle-vault-favorite") toggleVaultFavorite(id);
    else if (action === "toggle-insight-cluster") {
      ui.dashboardInsightGroup = ui.dashboardInsightGroup === value ? "" : (value || "");
      render();
    }
    else if (action === "set-dashboard-feed") {
      ui.dashboardFeed = value || "all";
      render();
    }
    else if (action === "set-dashboard-queue") {
      ui.dashboardQueueView = value || "readiness";
      render();
    }
  }

  function handleSubmit(event) {
    var form = event.target;
    if (!form.matches("[data-form]")) return;
    event.preventDefault();
    var data = objectFromForm(new FormData(form));
    var type = form.getAttribute("data-form");
    if (type === "content") saveContent(data);
    else if (type === "hook") saveHook(data);
    else if (type === "script") saveScript(data);
    else if (type === "campaign") saveCampaign(data);
    else if (type === "sponsor") saveSponsor(data);
    else if (type === "note") saveTeamNote(data);
    else if (type === "vault") saveVaultItem(data);
    else if (type === "thumbnail") saveThumbnailPlan(data);
  }

  function handleInput(event) {
    var target = event.target;
    if (target.matches("[data-live-hook]")) {
      ui.selectedHookDraft = target.value;
      render();
    }
  }

  function handleChange(event) {
    var target = event.target;
    if (target.id === "contentSelect") { ui.selectedContentId = target.value; render(); }
    else if (target.id === "scriptSelect") { ui.selectedScriptId = target.value; render(); }
    else if (target.id === "campaignSelect") { ui.selectedCampaignId = target.value; render(); }
    else if (target.id === "sponsorSelect") { ui.selectedSponsorId = target.value; render(); }
  }

  function handleKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
      event.preventDefault();
      openQuickAddModal();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveState();
      toast("Workspace saved", "Everything in ContentPilot is already persisted locally.");
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      performUndo();
      return;
    }
    if (event.key === "Escape") {
      closeModal();
      closePalette();
      closeNotifications();
    }
    if (event.key === "/" && document.activeElement !== els.globalSearch && !isFormField(document.activeElement)) {
      event.preventDefault();
      els.globalSearch.focus();
    }
  }

  function handleDragStart(event) {
    var card = event.target.closest("[data-drag-content]");
    if (!card) return;
    ui.dragContentId = card.getAttribute("data-drag-content");
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ui.dragContentId);
  }

  function handleDragEnd(event) {
    var card = event.target.closest("[data-drag-content]");
    if (card) card.classList.remove("is-dragging");
  }

  function handleDragOver(event) {
    var lane = event.target.closest("[data-drop-stage]");
    if (!lane) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event) {
    var lane = event.target.closest("[data-drop-stage]");
    if (!lane) return;
    event.preventDefault();
    var contentId = event.dataTransfer.getData("text/plain") || ui.dragContentId;
    var stage = lane.getAttribute("data-drop-stage");
    if (!contentId || !stage) return;
    moveContentToStage(contentId, stage);
  }

  function render() {
    ensureSelections();
    renderSidebar();
    renderTopFilters();
    renderSidebarPulse();
    renderMiniActivity();
    renderRoute();
    renderPalette();
    if (ui.notificationOpen) renderNotifications();
  }

  function renderSidebar() {
    els.sidebarNav.innerHTML = ROUTES.map(function (route) {
      var active = ui.route === route.id ? " is-active" : "";
      var badge = renderRouteBadge(route.id);
      return (
        '<button class="nav-link' + active + '" data-route="' + route.id + '">' +
          '<div class="nav-link-row"><strong>' + escapeHtml(route.title) + '</strong>' + badge + '</div>' +
          '<span class="nav-copy">' + escapeHtml(route.desc) + '</span>' +
        "</button>"
      );
    }).join("");
  }

  function renderRouteBadge(routeId) {
    var badge = getRouteBadgeValue(routeId);
    if (!badge) return "";
    return '<span class="nav-badge ' + (badge.tone || "is-info") + '">' + escapeHtml(badge.label) + "</span>";
  }

    function getRouteBadgeValue(routeId) {
      var metrics = computeDashboardMetrics();
      var insights = routeId === "dashboard" ? computeInsights() : null;
      if (routeId === "dashboard") return insights.length ? { label: insights.length + " alerts", tone: insights[0] ? insights[0].tone : "is-info" } : null;
    if (routeId === "pipeline") return state.content.length ? { label: state.content.filter(function (item) { return item.stage !== "Published"; }).length + " active", tone: metrics.blockedCount ? "is-warning" : "is-info" } : null;
      if (routeId === "viral") {
        var weakCount = state.content.filter(function (item) { return computeViralScore(item).total < 70; }).length;
        return weakCount ? { label: weakCount + " weak", tone: "is-warning" } : null;
      }
      if (routeId === "hooks") {
        var favoriteCount = state.hooks.filter(function (item) { return item.favorite; }).length;
        return state.hooks.length ? { label: (favoriteCount || state.hooks.length) + (favoriteCount ? " favorites" : " saved"), tone: "is-info" } : null;
      }
    if (routeId === "campaigns") return state.campaigns.length ? { label: state.campaigns.length + " waves", tone: metrics.campaignMomentum >= 70 ? "is-success" : "is-warning" } : null;
    if (routeId === "sponsors") return state.sponsors.length ? { label: metrics.sponsorRiskCount ? metrics.sponsorRiskCount + " risk" : state.sponsors.length + " deals", tone: metrics.sponsorRiskCount ? "is-warning" : "is-success" } : null;
    if (routeId === "calendar") return countPublishingGaps() ? { label: countPublishingGaps() + " gaps", tone: "is-warning" } : null;
    if (routeId === "team") return state.notes.length ? { label: state.notes.filter(function (item) { return !item.done; }).length + " open", tone: "is-info" } : null;
    if (routeId === "vault") return state.vault.length ? { label: state.vault.length + " saved", tone: "is-info" } : null;
    if (routeId === "reports") return state.reports.length ? { label: state.reports.length + " exports", tone: "is-info" } : null;
    return null;
  }

    function renderTopFilters() {
      var route = getRouteMeta(ui.route);
      els.routeTitle.textContent = route.title;
      els.routeEyebrow.textContent = route.eyebrow + " • " + getRouteContextSummary(ui.route);
      els.assigneeFilter.innerHTML = '<option value="all">All assignees</option>' + state.team.map(function (member) {
        var selected = ui.assigneeFilter === member.id ? ' selected' : "";
        return '<option value="' + member.id + '"' + selected + ">" + escapeHtml(member.name) + "</option>";
      }).join("");
      Array.prototype.forEach.call(document.querySelectorAll(".chip-button"), function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-value") === ui.viewFilter);
      });
    }

    function getRouteContextSummary(routeId) {
      var metrics = computeDashboardMetrics();
      var insights = computeInsights();
      if (routeId === "dashboard") {
        var criticalCount = insights.filter(function (item) { return item.severity === "High"; }).length;
        return criticalCount ? criticalCount + " critical actions, " + metrics.blockedCount + " blocked workflows" : "Queue is balanced across active operations";
      }
      if (routeId === "pipeline") return metrics.overdueCount + " overdue, " + metrics.blockedCount + " blocked, " + metrics.productionMomentum + "/100 momentum";
      if (routeId === "viral") return state.content.length ? state.content.filter(function (item) { return computeViralScore(item).total < 70; }).length + " items below opportunity target" : "Select content to evaluate packaging strength";
      if (routeId === "hooks") return state.hooks.length ? state.hooks.filter(function (item) { return item.favorite; }).length + " favorite angles saved for reuse" : "Generate first-pass hooks from active content briefs";
      if (routeId === "scripts") return state.scripts.length ? state.scripts.length + " scripts tracked with pacing review" : "Build script structure before moving to production";
      if (routeId === "thumbnail") return state.content.length ? metrics.platformBalanceLabel : "Plan clarity and emotional direction before design";
      if (routeId === "repurpose") return state.content.length ? "Repurpose across " + Object.keys(metrics.platformDistribution).length + " active channels" : "Adapt one approved concept into channel-ready versions";
      if (routeId === "campaigns") return state.campaigns.length ? metrics.campaignMomentum + "/100 launch momentum" : "Create a launch wave to sequence content pressure";
      if (routeId === "sponsors") return state.sponsors.length ? metrics.sponsorRiskCount + " sponsor risks, " + state.sponsors.length + " active deals" : "Track deliverables, approvals, and payment confidence";
      if (routeId === "calendar") return countPublishingGaps() ? countPublishingGaps() + " publishing gaps in the next 14 days" : "Publishing rhythm is currently protected";
      if (routeId === "team") return state.notes.length ? state.notes.filter(function (item) { return !item.done; }).length + " open notes and blockers" : "Capture approvals, handoffs, and execution context";
      if (routeId === "vault") return state.vault.length ? state.vault.length + " reusable creative references stored" : "Save high-performing hooks, CTAs, and concept patterns";
      if (routeId === "reports") return state.reports.length ? state.reports.length + " recent exports available locally" : "Generate printable local reports from live workspace data";
      if (routeId === "settings") return "Theme, backups, onboarding, and workspace recovery controls";
      return "Operational visibility from local workspace data";
    }

  function renderSidebarPulse() {
    var metrics = computeDashboardMetrics();
    els.sidebarPulse.innerHTML =
      '<div class="pulse-list pulse-list-compact">' +
        renderPulseItem("Health score", metrics.healthScore + "/100", toneByValue(metrics.healthScore, 80, 65), metrics.healthSummary) +
        renderPulseItem("Blocked workflows", String(metrics.blockedCount), metrics.blockedCount === 0 ? "is-success" : metrics.blockedCount >= 3 ? "is-danger" : "is-warning", metrics.blockedCount ? "Requires owner attention" : "No active blockers logged") +
        renderPulseItem("Sponsor pressure", metrics.sponsorRiskLabel, metrics.sponsorRiskCount === 0 ? "is-success" : "is-warning", metrics.activeWaveName || "No active sponsor escalations") +
        renderPulseItem("Publishing streak", metrics.publishingStreak + " days", metrics.publishingStreak >= 3 ? "is-success" : metrics.publishingStreak >= 1 ? "is-warning" : "is-info", metrics.weeklyCompletionRate + "% weekly completion") +
      "</div>";
  }

  function renderMiniActivity() {
    els.miniActivity.innerHTML =
      '<div class="mini-activity">' +
        state.activity.slice(0, 4).map(function (item) {
          var tone = inferActivityTone(item);
          return (
            '<div class="mini-activity-item ' + tone + '">' +
              '<div class="mini-activity-head"><strong>' + escapeHtml(item.title) + '</strong><span class="helper-text">' + escapeHtml(item.when) + "</span></div>" +
              '<div class="helper-text">' + escapeHtml(item.detail) + "</div>" +
            "</div>"
          );
        }).join("") +
      "</div>";
  }

  function renderRoute() {
    var html = "";
    if (ui.route === "dashboard") html = renderDashboard();
    else if (ui.route === "pipeline") html = renderPipeline();
    else if (ui.route === "viral") html = renderViralEngine();
    else if (ui.route === "hooks") html = renderHooks();
    else if (ui.route === "scripts") html = renderScripts();
    else if (ui.route === "thumbnail") html = renderThumbnailEngine();
    else if (ui.route === "repurpose") html = renderRepurpose();
    else if (ui.route === "campaigns") html = renderCampaigns();
    else if (ui.route === "sponsors") html = renderSponsors();
    else if (ui.route === "calendar") html = renderCalendar();
    else if (ui.route === "team") html = renderTeam();
    else if (ui.route === "vault") html = renderVault();
    else if (ui.route === "reports") html = renderReports();
    else if (ui.route === "settings") html = renderSettings();
    els.appView.innerHTML = html;
  }

  function renderDashboard() {
    if (!state.content.length) {
      return (
        '<section class="hero-panel">' +
          '<p class="eyebrow">Content Operations Workspace</p>' +
          '<h3 class="hero-title">Start with one content item and let the workspace generate the operational signal.</h3>' +
          '<p class="hero-copy">Dashboard metrics, alerts, readiness, and exports become meaningful as soon as the first production record is added.</p>' +
          '<div class="hero-actions"><button class="button button-primary" data-action="open-content">Create Content Item</button><button class="button button-secondary" data-route="settings">Open Settings</button></div>' +
        '</section>'
      );
    }
    var metrics = computeDashboardMetrics();
    var insights = computeInsights();
    var bottlenecks = computeStagePressure();
    var lowReadiness = state.content.filter(function (item) { return computeReadiness(item).score < 65; }).slice(0, 4);
    var weakOpportunities = state.content.slice().sort(function (a, b) { return computeViralScore(a).total - computeViralScore(b).total; }).slice(0, 4);
    var attentionItems = ui.dashboardQueueView === "opportunity" ? weakOpportunities : lowReadiness;
    var insightGroups = buildInsightClusters(insights);
    var filteredActivity = getDashboardActivity(ui.dashboardFeed).slice(0, 4);
    var topCriticalInsights = insights.slice(0, 3);
    var topInsight = insights[0];

    return (
      renderFilterSummary() +
      '<section class="hero-panel hero-command">' +
        '<div class="hero-command-grid">' +
          '<div class="hero-main">' +
            '<p class="eyebrow">Operational Pulse™</p>' +
            '<h3 class="hero-title">Control launch pressure, sponsor exposure, and publishing rhythm from one operating brain.</h3>' +
            '<p class="hero-copy">' + escapeHtml(metrics.operationalPulseDetail) + '</p>' +
            '<div class="hero-status-strip">' +
              renderHeroPulse("Operational pulse", metrics.operationalPulseLabel, metrics.operationalPulseTone) +
              renderHeroPulse("Launch confidence", metrics.launchConfidence + "/100", toneByValue(metrics.launchConfidence, 78, 60)) +
              renderHeroPulse("Sponsor pressure", metrics.sponsorRiskLabel, metrics.sponsorRiskCount ? "is-warning" : "is-success") +
              renderHeroPulse("Burnout risk", metrics.burnoutRiskLabel, toneByValue(100 - metrics.burnoutRisk, 72, 50)) +
            '</div>' +
            '<div class="hero-chip-ribbon">' +
              renderHeroChip(metrics.momentumSignal, toneByValue(metrics.productionMomentum, 76, 58)) +
              renderHeroChip(metrics.launchSignal, toneByValue(metrics.launchConfidence, 76, 58)) +
              renderHeroChip(metrics.reviewSignal, metrics.reviewStuck >= 3 ? "is-warning" : "is-info") +
              renderHeroChip(metrics.distributionSignal, metrics.dominantPlatformShare >= 45 ? "is-warning" : "is-success") +
            '</div>' +
            '<div class="hero-signal-grid">' +
              renderHeroSignal("Publishing streak", metrics.publishingStreak + " days", metrics.publishingStreak >= 3 ? "Rhythm stable." : "Cadence pressure building.", metrics.publishingStreak >= 3 ? "is-success" : "is-warning") +
              renderHeroSignal("Active launch wave", metrics.activeWaveName, metrics.activeWaveDeadline ? "Pressure point: " + formatDate(metrics.activeWaveDeadline) : "No active launch pressure.", toneByValue(metrics.launchConfidence, 76, 58)) +
              renderHeroSignal("Weekly completion", metrics.weeklyCompletionRate + "%", metrics.productionMomentumLabel, toneByValue(metrics.weeklyCompletionRate, 72, 54)) +
            '</div>' +
            '<div class="hero-actions">' +
              '<button class="button button-primary" data-route="pipeline">Open Pipeline</button>' +
              '<button class="button button-secondary" data-action="open-quick-add">Create Content Item</button>' +
              '<button class="button button-ghost" data-route="reports">Generate Report</button>' +
            '</div>' +
          '</div>' +
          '<aside class="hero-rail">' +
            (topInsight ? renderTopInsight(topInsight) : renderEmpty("No escalations active", "The command center is currently balanced and no urgent intervention is required.")) +
            '<div class="hero-rail-stack">' +
              renderRailCard("Sponsor pressure", metrics.sponsorRiskCount ? metrics.sponsorRiskCount + " deals at risk" : "No sponsor escalation", metrics.sponsorRiskCount ? "Approvals are compressing delivery confidence." : "Sponsor delivery is stable.", metrics.sponsorRiskCount ? "is-warning" : "is-success") +
              renderRailCard("Workflow blockage", metrics.blockedCount ? metrics.blockedCount + " blocked assets" : "No active blockers", metrics.blockedCount ? "Dependencies are reducing output speed." : "Critical handoffs are clear.", metrics.blockedCount >= 3 ? "is-danger" : metrics.blockedCount ? "is-warning" : "is-success") +
              renderRailCard("Platform dependency", metrics.dominantPlatform ? metrics.dominantPlatform + " at " + metrics.dominantPlatformShare + "%" : "Balanced distribution", metrics.platformBalanceLabel, metrics.dominantPlatformShare >= 45 ? "is-warning" : "is-info") +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</section>' +
      '<section class="metric-grid dashboard-metric-grid">' +
        renderMetricCard("Content Health", metrics.healthScore + "/100", metrics.healthSummary, "Readiness, rhythm, sponsor risk, and overdue pressure combined.", toneByValue(metrics.healthScore, 80, 65)) +
        renderMetricCard("Consistency", metrics.consistencyLabel, metrics.consistencySummary, "Scheduled and published volume across the 14-day window.", toneByValue(metrics.consistencyScore, 80, 55)) +
        renderMetricCard("Campaign Momentum", metrics.campaignMomentum + "/100", metrics.campaignMomentumLabel, "Active launch pacing and sequence completion.", toneByValue(metrics.campaignMomentum, 75, 55)) +
        renderMetricCard("Platform Balance", metrics.platformBalance + "/100", metrics.platformBalanceLabel, "Channel concentration and distribution resilience.", metrics.dominantPlatformShare >= 45 ? "is-warning" : "is-info") +
      '</section>' +
      '<section class="dashboard-layout">' +
        '<div class="panel dashboard-primary-panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Smart Insight Engine</p><h3>Grouped operational escalations</h3></div><button class="text-button" data-action="open-notifications">Open center</button></div>' +
          '<div class="dashboard-panel-intro"><strong>' + insights.filter(function (item) { return item.severity === "High"; }).length + ' critical interventions</strong><span class="helper-text">Workflow, quality, schedule, and commercial pressure.</span></div>' +
          '<div class="priority-strip">' + topCriticalInsights.map(renderPrioritySignal).join("") + '</div>' +
          '<div class="list-stack">' + (insights.length ? insightGroups.map(renderInsightCluster).join("") : renderEmpty("No active insights", "The workspace is balanced, timely, and ready to publish.")) + '</div>' +
        '</div>' +
        '<div class="panel dashboard-secondary-panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Operational Pressure</p><h3>Where output is tightening</h3></div></div>' +
          '<div class="pressure-grid pressure-grid-compact">' +
            renderPressureCard("Overdue", String(metrics.overdueCount), metrics.overdueCount ? "Deadlines slipped." : "No misses.", metrics.overdueCount ? "is-danger" : "is-success") +
            renderPressureCard("Review", String(metrics.reviewStuck), metrics.reviewStuck >= 3 ? "Approvals slowing readiness." : "Queue controlled.", metrics.reviewStuck >= 3 ? "is-warning" : "is-info") +
            renderPressureCard("Dependencies", String(metrics.dependencyRiskCount), metrics.dependencyRiskCount ? "Upstream drag active." : "Dependencies controlled.", metrics.dependencyRiskCount ? "is-warning" : "is-success") +
            renderPressureCard("Urgent", String(metrics.urgentDeadlineCount), metrics.urgentDeadlineCount ? "48-hour pressure." : "No immediate crunch.", metrics.urgentDeadlineCount >= 2 ? "is-danger" : "is-info") +
          '</div>' +
          '<div class="stage-pressure-cluster">' + bottlenecks.slice(0, 3).map(function (item) {
            return '<div class="stage-pressure-row"><div class="stage-pressure-copy"><strong>' + escapeHtml(item.stage) + '</strong><span class="helper-text">' + stagePressureLabel(item.count) + '</span></div><div class="stage-pressure-value"><span class="mini-badge">' + item.count + ' items</span><div class="spark-bar"><span style="width:' + Math.min(100, item.count * 18) + '%"></span></div></div></div>';
          }).join("") + '</div>' +
        '</div>' +
        '<div class="panel dashboard-timeline-panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Operational Feed</p><h3>Recent workflow movement</h3></div><button class="text-button" data-route="team">Team view</button></div>' +
          '<div class="dashboard-panel-intro"><strong>Action-aware chronology</strong><span class="helper-text">Filter by risk, delivery, or completed output.</span></div>' +
          '<div class="inline-actions dashboard-chip-row">' +
            renderDashboardChip("All", "all", ui.dashboardFeed) +
            renderDashboardChip("Risks", "risk", ui.dashboardFeed) +
            renderDashboardChip("Delivery", "delivery", ui.dashboardFeed) +
            renderDashboardChip("Published", "published", ui.dashboardFeed) +
          '</div>' +
          '<div class="timeline timeline-strong">' + (filteredActivity.length ? filteredActivity.slice(0, 4).map(renderTimelineItem).join("") : renderEmpty("No matching feed events", "This filter is clear right now. Switch views or keep the queue moving.")) + '</div>' +
        '</div>' +
        '<div class="panel dashboard-analytics-panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Channel Intelligence</p><h3>Distribution, dependency, and pressure</h3></div><button class="text-button" data-route="calendar">View calendar</button></div>' +
          '<div class="dashboard-panel-intro"><strong>' + metrics.platformBalance + '/100 balance score</strong><span class="helper-text">' + escapeHtml(metrics.platformBalanceLabel) + '</span></div>' +
          renderDistributionBars(metrics.platformDistribution) +
        '</div>' +
        '<div class="panel dashboard-watchlist-panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Attention Queue</p><h3>Assets that need intervention next</h3></div><button class="text-button" data-route="' + (ui.dashboardQueueView === "opportunity" ? "viral" : "pipeline") + '">Open workflow</button></div>' +
          '<div class="inline-actions dashboard-chip-row">' +
            renderDashboardChip("Readiness", "readiness", ui.dashboardQueueView, "set-dashboard-queue") +
            renderDashboardChip("Opportunity", "opportunity", ui.dashboardQueueView, "set-dashboard-queue") +
          '</div>' +
          '<div class="list-stack">' + (attentionItems.length ? attentionItems.map(ui.dashboardQueueView === "opportunity" ? renderOpportunityRow : renderReadinessRow).join("") : renderEmpty("Attention queue is clear", ui.dashboardQueueView === "opportunity" ? "No low-opportunity items need packaging intervention right now." : "No low-readiness items are dragging schedule confidence.")) + '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderHeroPulse(label, value, tone) {
    return '<div class="hero-pulse ' + (tone || "is-info") + '"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
  }

  function renderHeroChip(text, tone) {
    return '<div class="hero-chip ' + (tone || "is-info") + '"><span class="severity-dot ' + (tone || "is-info") + '"></span><strong>' + escapeHtml(text) + '</strong></div>';
  }

  function renderDashboardChip(label, value, activeValue, action) {
    var isActive = value === activeValue ? " is-active" : "";
    return '<button class="chip-button' + isActive + '" data-action="' + escapeHtml(action || "set-dashboard-feed") + '" data-value="' + escapeHtml(value) + '">' + escapeHtml(label) + '</button>';
  }

  function renderPrioritySignal(item) {
    return '<div class="priority-signal ' + item.tone + '"><div class="priority-signal-top"><span class="severity-marker ' + item.tone + '">' + escapeHtml(item.severity) + '</span><span class="trend-pill">' + escapeHtml(item.marker) + '</span></div><strong>' + escapeHtml(item.title) + '</strong><p class="helper-text">' + escapeHtml(item.shortReason || item.reason) + '</p><button class="button button-ghost" data-action="apply-insight-action" data-id="' + item.id + '" data-value="' + escapeHtml(item.cta || "open-content") + '">' + escapeHtml(item.primaryLabel || "Open") + '</button></div>';
  }

  function buildInsightClusters(insights) {
    var groups = [
      createInsightCluster("workflow", "Workflow blockage", "Dependencies, review congestion, and stalled movement."),
      createInsightCluster("quality", "Readiness and packaging", "Hooks, CTAs, and readiness issues lowering publish confidence."),
      createInsightCluster("schedule", "Schedule pressure", "Overdue items, gaps, and slowing weekly rhythm."),
      createInsightCluster("commercial", "Campaign and sponsor risk", "Launch readiness and commercial delivery exposure.")
    ];
    insights.forEach(function (item) {
      var group = groups.filter(function (entry) { return entry.id === getInsightClusterId(item); })[0] || groups[0];
      group.items.push(item);
    });
    return groups.filter(function (group) { return group.items.length; }).map(finalizeInsightCluster);
  }

  function createInsightCluster(id, title, description) {
    return { id: id, title: title, description: description, items: [] };
  }

  function finalizeInsightCluster(group) {
    group.items.sort(compareInsightSeverity);
    group.primary = group.items[0];
    group.highCount = group.items.filter(function (item) { return item.severity === "High"; }).length;
    group.tone = group.primary ? group.primary.tone : "is-info";
    group.summary = group.primary ? buildInsightClusterSummary(group) : group.description;
    return group;
  }

  function getInsightClusterId(item) {
    var text = (item.title + " " + item.reason + " " + item.action).toLowerCase();
    if (containsAny(text, ["hook", "cta", "opportunity", "readiness", "topic"])) return "quality";
    if (containsAny(text, ["sponsor", "campaign", "approval", "deliverable"])) return "commercial";
    if (containsAny(text, ["overdue", "gap", "slowdown", "deadline", "publish"])) return "schedule";
    return "workflow";
  }

  function buildInsightClusterSummary(group) {
    if (group.id === "workflow") return group.items.length + " workflow risks need routing.";
    if (group.id === "quality") return group.items.length + " readiness issues need correction.";
    if (group.id === "schedule") return group.items.length + " schedule risks are compressing cadence.";
    if (group.id === "commercial") return group.items.length + " launch or sponsor risks threaten delivery.";
    return group.description;
  }

  function renderInsightCluster(group) {
    var expanded = ui.dashboardInsightGroup === group.id;
    var preview = group.items.slice(0, expanded ? group.items.length : Math.min(2, group.items.length));
    return (
      '<article class="insight-cluster ' + group.tone + '">' +
        '<button class="insight-cluster-head" data-action="toggle-insight-cluster" data-value="' + group.id + '">' +
          '<div class="insight-cluster-copy">' +
            '<div class="insight-topline"><span class="severity-marker ' + group.tone + '">' + escapeHtml(group.title) + '</span><span class="trend-pill">' + group.items.length + ' signals</span></div>' +
            '<h4>' + escapeHtml(group.summary) + '</h4>' +
            '<p class="helper-text">' + escapeHtml(group.description) + '</p>' +
          '</div>' +
          '<div class="insight-cluster-meta"><span class="status-badge ' + group.tone + '">' + (group.highCount ? group.highCount + ' critical' : group.items.length + ' open') + '</span><span class="cluster-toggle">' + (expanded ? "Collapse" : "Expand") + '</span></div>' +
        '</button>' +
        '<div class="insight-cluster-body' + (expanded ? ' is-open' : '') + '">' +
          '<div class="list-stack insight-cluster-list">' + preview.map(renderInsightRow).join("") + '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderPipeline() {
    var grouped = groupByStage(getFilteredContent());
    return (
      renderFilterSummary() +
      '<section class="panel">' +
        '<div class="panel-header"><div><p class="eyebrow">Pipeline Overview</p><h3>Drag content across the production system</h3></div><div class="inline-actions"><button class="button button-secondary" data-action="open-quick-add">Create Content Item</button><button class="button button-ghost" data-action="open-notifications">Review Blockers</button></div></div>' +
        '<div class="kanban">' + STAGES.map(function (stage) {
          var items = grouped[stage] || [];
          return (
            '<div class="kanban-column">' +
              '<div class="stage-head"><div><h4>' + escapeHtml(stage) + '</h4><div class="helper-text">' + items.length + ' items</div></div><button class="stage-chip" data-action="open-quick-add">Add</button></div>' +
              '<div class="stage-stack" data-drop-stage="' + escapeHtml(stage) + '">' +
                (items.length ? items.map(renderContentCard).join("") : renderEmpty("No items", "Drop work here or create a new content asset.")) +
              '</div>' +
            '</div>'
          );
        }).join("") + '</div>' +
      '</section>'
    );
  }

  function renderViralEngine() {
    var item = getSelectedContent();
    if (!item) {
      return renderFilterSummary() + '<section class="panel">' + renderEmpty("No content available", "Create a content item first to score hook strength, title quality, CTA clarity, retention risk, and platform fit.") + '<div class="inline-actions" style="margin-top:16px;"><button class="button button-primary" data-action="open-content">Create Content Item</button></div></section>';
    }
    var score = computeViralScore(item);
    return (
      renderFilterSummary() +
      '<section class="two-column">' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Opportunity Scan</p><h3>Score packaging quality without any external services</h3></div></div>' +
          renderContentSelector("contentSelect", ui.selectedContentId) +
          '<div class="score-grid">' +
            '<div class="score-wheel"><div class="score-wheel-inner"><span class="helper-text">Opportunity</span><strong>' + score.total + '</strong><span class="helper-text">out of 100</span></div></div>' +
            '<ul class="score-list">' + score.breakdown.map(function (entry) {
              return '<li><strong>' + escapeHtml(entry.label) + ':</strong> ' + entry.score + '/100<br><span class="helper-text">' + escapeHtml(entry.explain) + '</span></li>';
            }).join("") + '</ul>' +
          '</div>' +
          '<div class="inline-actions"><button class="button button-primary" data-action="save-viral-result" data-id="' + item.id + '">Save Result to Content</button><button class="button button-secondary" data-action="build-hook-ideas">Generate Hook Ideas</button></div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Improvement Checklist</p><h3>Before / after direction</h3></div></div>' +
          '<ul class="warning-list">' + score.recommendations.map(function (entry) { return '<li>' + escapeHtml(entry) + '</li>'; }).join("") + '</ul>' +
          '<div class="panel" style="margin-top:16px;"><p class="eyebrow">Current concept</p><p class="helper-text">' + escapeHtml(item.hook || item.title) + '</p><p class="eyebrow" style="margin-top:12px;">Improved direction</p><p class="helper-text">' + escapeHtml(score.afterExample) + '</p></div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderHooks() {
    var selected = getSelectedContent();
    var liveSeed = ui.selectedHookDraft || (selected ? selected.hook : "");
    var live = analyzeHookDraft(liveSeed);
    var hooks = getFilteredHooks();
    return (
      renderFilterSummary() +
      '<section class="two-column">' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Live Workspace</p><h3>Draft and score hooks before saving</h3></div><button class="button button-secondary" data-action="open-hook-builder">Save Hook</button></div>' +
          '<div class="field"><label for="liveHookInput">Hook draft</label><textarea id="liveHookInput" data-live-hook placeholder="Write a curiosity, authority, urgency, or story-led hook.">' + escapeHtml(liveSeed) + '</textarea></div>' +
          '<div class="score-grid">' +
            '<ul class="score-list">' + live.metrics.map(function (entry) { return '<li><strong>' + escapeHtml(entry.label) + ':</strong> ' + entry.score + '/100</li>'; }).join("") + '</ul>' +
            '<div class="panel"><p class="eyebrow">Hook Score</p><h3>' + live.total + '/100</h3><p class="helper-text">' + escapeHtml(live.summary) + '</p></div>' +
          '</div>' +
          '<ul class="warning-list">' + live.notes.map(function (note) { return '<li>' + escapeHtml(note) + '</li>'; }).join("") + '</ul>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Saved Hooks</p><h3>Favorites and tested angles</h3></div><button class="text-button" data-route="vault">Open vault</button></div>' +
          '<div class="swipe-vault">' + (hooks.length ? hooks.map(renderHookRow).join("") : renderEmpty("No hooks found", "Save a hook or clear your search filters.")) + '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderScripts() {
    var script = getSelectedScript();
    if (!state.scripts.length) {
      return renderFilterSummary() + '<section class="panel">' + renderEmpty("No scripts saved", state.content.length ? "Create a script to analyze pacing, filler, proof, and CTA strength." : "Create a content item first, then build a script around it.") + '<div class="inline-actions" style="margin-top:16px;"><button class="button button-primary" data-action="' + (state.content.length ? 'open-script-editor' : 'open-content') + '">' + (state.content.length ? 'Create Script' : 'Create Content Item') + '</button></div></section>';
    }
    var analysis = analyzeScript(script);
    return (
      renderFilterSummary() +
      '<section class="two-column">' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Active Script</p><h3>Section structure and clarity</h3></div><div class="inline-actions"><button class="button button-secondary" data-action="open-script-editor">Create Script</button><button class="button button-ghost" data-action="open-script-editor" data-id="' + script.id + '">Edit Script</button></div></div>' +
          renderScriptSelector() +
          '<div class="list-stack">' + ["hook", "intro", "story", "value", "proof", "cta"].map(function (key) {
            return '<div class="list-item"><h4>' + escapeHtml(key.toUpperCase()) + '</h4><div class="helper-text">' + escapeHtml(script.sections[key]) + '</div></div>';
          }).join("") + '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Analysis</p><h3>Pacing, filler, and retention</h3></div></div>' +
          '<div class="metric-grid">' +
            renderMiniMetric("Retention", analysis.retention + "/100") +
            renderMiniMetric("Pacing", analysis.pacing) +
            renderMiniMetric("Filler warnings", String(analysis.fillerWarnings.length)) +
            renderMiniMetric("Sections complete", String(analysis.checkpoints)) +
          '</div>' +
          '<ul class="warning-list">' + analysis.notes.map(function (note) { return '<li>' + escapeHtml(note) + '</li>'; }).join("") + '</ul>' +
        '</div>' +
      '</section>'
    );
  }

  function renderThumbnailEngine() {
    var item = getSelectedContent();
    if (!item) {
      return renderFilterSummary() + '<section class="panel">' + renderEmpty("No content available", "Create a content item to plan emotional direction, text placement, clutter control, and focal story before design work starts.") + '<div class="inline-actions" style="margin-top:16px;"><button class="button button-primary" data-action="open-content">Create Content Item</button></div></section>';
    }
    var analysis = analyzeThumbnailPlan(item);
    return (
      renderFilterSummary() +
      '<section class="two-column">' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Planner</p><h3>Emotional direction and visual hierarchy</h3></div><button class="button button-secondary" data-action="open-thumbnail-planner" data-id="' + item.id + '">Edit Strategy</button></div>' +
          renderContentSelector("contentSelect", ui.selectedContentId) +
          '<div class="list-stack">' +
            renderSplitStat("Emotional direction", item.thumbnailPlan.direction) +
            renderSplitStat("Text placement", item.thumbnailPlan.textPlacement) +
            renderSplitStat("Clutter level", item.thumbnailPlan.clutter) +
            renderSplitStat("Visual focus", item.thumbnailPlan.focus) +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Strategy Score</p><h3>Thumbnail readiness</h3></div></div>' +
          '<ul class="score-list">' + analysis.indicators.map(function (entry) {
            return '<li><strong>' + escapeHtml(entry.label) + ':</strong> ' + escapeHtml(entry.value) + '</li>';
          }).join("") + '</ul>' +
          '<ul class="warning-list">' + analysis.notes.map(function (note) { return '<li>' + escapeHtml(note) + '</li>'; }).join("") + '</ul>' +
        '</div>' +
      '</section>'
    );
  }

  function renderRepurpose() {
    var item = getSelectedContent();
    if (!item) {
      return renderFilterSummary() + '<section class="panel">' + renderEmpty("No source content available", "Create a content item first so ContentPilot can adapt the core angle into platform-specific versions.") + '<div class="inline-actions" style="margin-top:16px;"><button class="button button-primary" data-action="open-content">Create Content Item</button></div></section>';
    }
    var outputs = buildRepurposePlan(item);
    return (
      renderFilterSummary() +
      '<section class="panel">' +
        '<div class="panel-header"><div><p class="eyebrow">Source Content</p><h3>Turn one core idea into a full platform stack</h3></div></div>' +
        renderContentSelector("contentSelect", ui.selectedContentId) +
        '<div class="repurpose-grid">' + outputs.map(function (entry) {
          return (
            '<div class="asset-card">' +
              '<div class="entity-head"><h4>' + escapeHtml(entry.platform) + '</h4><span class="score-badge">' + entry.score + '/100</span></div>' +
              '<p class="helper-text">' + escapeHtml(entry.angle) + '</p>' +
              '<ul class="detail-list">' +
                '<li><strong>Duration:</strong> ' + escapeHtml(entry.duration) + '</li>' +
                '<li><strong>CTA:</strong> ' + escapeHtml(entry.cta) + '</li>' +
                '<li><strong>Warning:</strong> ' + escapeHtml(entry.risk) + '</li>' +
              '</ul>' +
              '<div class="inline-actions" style="margin-top:12px;"><button class="button button-ghost" data-action="copy-repurpose" data-value="' + escapeHtml(entry.platform) + '">Copy angle</button><button class="button button-ghost" data-action="save-repurpose" data-value="' + escapeHtml(entry.platform) + '">Save to vault</button></div>' +
            '</div>'
          );
        }).join("") + '</div>' +
      '</section>'
    );
  }

  function renderCampaigns() {
    var campaigns = getFilteredCampaigns();
    var selected = getSelectedCampaign();
    if (!state.campaigns.length) {
      return renderFilterSummary() + '<section class="panel">' + renderEmpty("No campaigns saved", "Build a campaign to track launch waves, offers, progress, and deadline risk from one place.") + '<div class="inline-actions" style="margin-top:16px;"><button class="button button-primary" data-action="open-campaign">Build Campaign</button></div></section>';
    }
    return (
      renderFilterSummary() +
      '<section class="two-column">' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Campaign Stack</p><h3>Launches, offers, and publishing waves</h3></div><button class="button button-secondary" data-action="open-campaign">Build Campaign</button></div>' +
          renderCampaignSelector() +
          '<div class="list-stack">' + (campaigns.length ? campaigns.map(renderCampaignRow).join("") : renderEmpty("No campaigns match the current filters", "Clear search or filters to review the full campaign stack.")) + '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Selected Campaign</p><h3>' + escapeHtml(selected.name) + '</h3></div><div class="inline-actions"><button class="button button-secondary" data-action="open-campaign" data-id="' + selected.id + '">Edit</button><button class="button button-ghost" data-action="export-report" data-value="campaign">Export report</button></div></div>' +
          '<div class="list-stack">' +
            renderSplitStat("Offer", selected.offer) +
            renderSplitStat("Progress", selected.progress + "%") +
            renderSplitStat("Deadline", formatDate(selected.deadline)) +
            renderSplitStat("Wave", selected.waveLabel) +
          '</div>' +
          '<ul class="warning-list">' + selected.sequence.map(function (step) { return '<li>' + escapeHtml(step) + '</li>'; }).join("") + '</ul>' +
        '</div>' +
      '</section>'
    );
  }

  function renderSponsors() {
    var sponsors = getFilteredSponsors();
    var sponsor = getSelectedSponsor();
    if (!state.sponsors.length) {
      return renderFilterSummary() + '<section class="panel">' + renderEmpty("No sponsor deals saved", "Add a sponsor deal to track deliverables, approvals, payment state, and deadline risk.") + '<div class="inline-actions" style="margin-top:16px;"><button class="button button-primary" data-action="open-sponsor">Add Sponsor Deal</button></div></section>';
    }
    return (
      renderFilterSummary() +
      '<section class="two-column">' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Deal Desk</p><h3>Sponsor deliverables and payment flow</h3></div><button class="button button-secondary" data-action="open-sponsor">Add Sponsor Deal</button></div>' +
          renderSponsorSelector() +
          '<div class="list-stack">' + (sponsors.length ? sponsors.map(renderSponsorRow).join("") : renderEmpty("No sponsors match the current filters", "Clear search or filters to review the full sponsor list.")) + '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Selected Sponsor</p><h3>' + escapeHtml(sponsor.name) + '</h3></div><div class="inline-actions"><button class="button button-secondary" data-action="open-sponsor" data-id="' + sponsor.id + '">Edit</button><button class="button button-ghost" data-action="export-report" data-value="sponsor">Export report</button></div></div>' +
          '<div class="list-stack">' +
            renderSplitStat("Deal value", "$" + sponsor.value.toLocaleString()) +
            renderSplitStat("Approval", sponsor.approval) +
            renderSplitStat("Payment", sponsor.paymentStatus) +
            renderSplitStat("Deadline", formatDate(sponsor.deadline)) +
          '</div>' +
          '<ul class="warning-list">' + sponsor.deliverables.map(function (step) { return '<li>' + escapeHtml(step) + '</li>'; }).join("") + '</ul>' +
          '<div class="inline-actions"><button class="button button-ghost" data-action="toggle-approval" data-id="' + sponsor.id + '">Advance Approval</button><button class="button button-ghost" data-action="toggle-payment" data-id="' + sponsor.id + '">Advance Payment</button></div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderCalendar() {
    var calendar = buildCalendar();
    return (
      renderFilterSummary() +
      '<section class="panel">' +
        '<div class="calendar-head"><div><p class="eyebrow">Publishing Calendar</p><h3>Consistency, gaps, and burnout warnings</h3></div><button class="text-button" data-route="pipeline">Open pipeline</button></div>' +
        '<div class="calendar-grid">' + calendar.map(renderCalendarDay).join("") + '</div>' +
      '</section>'
    );
  }

  function renderTeam() {
    var notes = getFilteredNotes();
    return (
      renderFilterSummary() +
      '<section class="two-column">' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Approvals</p><h3>Internal review workflow</h3></div></div>' +
          '<div class="list-stack">' + state.approvals.map(renderApprovalRow).join("") + '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Team Notes</p><h3>Assignments, blockers, and handoffs</h3></div><button class="button button-secondary" data-action="open-team-note">Add Note</button></div>' +
          '<div class="team-grid">' + (notes.length ? notes.map(renderNoteRow).join("") : renderEmpty("No notes found", "Add a blocker, review note, or strategy direction.")) + '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderVault() {
    var items = getFilteredVaultItems();
    return (
      renderFilterSummary() +
      '<section class="panel">' +
        '<div class="panel-header"><div><p class="eyebrow">Swipe Vault</p><h3>Hooks, CTAs, titles, and creative references</h3></div><button class="button button-secondary" data-action="open-vault-item">Add Vault Item</button></div>' +
        '<div class="swipe-vault">' + (items.length ? items.map(renderVaultRow).join("") : renderEmpty("No vault items found", "Capture a title, CTA, hook, thumbnail idea, or campaign note.")) + '</div>' +
      '</section>'
    );
  }

  function renderReports() {
    var metrics = computeDashboardMetrics();
    return (
      renderFilterSummary() +
      '<section class="two-column">' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Executive Export Center</p><h3>Generate local HTML reports</h3></div></div>' +
          '<div class="dashboard-panel-intro"><strong>Operational Pulse™: ' + escapeHtml(metrics.operationalPulseLabel) + '</strong><span class="helper-text">' + escapeHtml(metrics.operationalPulseDetail) + '</span></div>' +
          '<div class="report-list">' +
            renderReportCard("Content Plan Report", "content-plan", "Executive plan for content readiness, risk, and next steps.") +
            renderReportCard("Campaign Progress Report", "campaign", "Launch status, sequence health, and milestone progress.") +
            renderReportCard("Sponsor Delivery Report", "sponsor", "Deliverables, approvals, payment state, and revenue risk.") +
            renderReportCard("Production Bottleneck Report", "bottleneck", "Stage pressure, overdue work, and stuck review items.") +
            renderReportCard("Weekly Creator Operations Report", "weekly", "Topline health, publishing balance, and recommendations.") +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-header"><div><p class="eyebrow">Export History</p><h3>Recent generated files</h3></div><button class="button button-secondary" data-action="export-json">Backup JSON</button></div>' +
          '<div class="list-stack">' + (state.reports.length ? state.reports.slice(0, 8).map(renderReportHistory).join("") : renderEmpty("No exports yet", "Generate an HTML report to populate export history.")) + '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderSettings() {
    return (
      '<section class="panel">' +
        '<div class="panel-header"><div><p class="eyebrow">Workspace Settings</p><h3>Persistence, backups, onboarding, and theme controls</h3></div></div>' +
        '<div class="three-column">' +
          '<div class="card"><h4>Theme</h4><p class="helper-text">Current mode: ' + escapeHtml(state.settings.theme) + '</p><button class="button button-secondary" data-action="toggle-theme">Toggle Theme</button></div>' +
          '<div class="card"><h4>Backup & Restore</h4><p class="helper-text">Export or import the complete local workspace safely.</p><div class="inline-actions"><button class="button button-secondary" data-action="export-json">Export JSON</button><button class="button button-ghost" data-action="import-json">Import JSON</button></div></div>' +
          '<div class="card"><h4>Onboarding</h4><p class="helper-text">Replay the guided product walkthrough for first-time buyers.</p><button class="button button-secondary" data-action="reset-onboarding">Replay Walkthrough</button></div>' +
        '</div>' +
        '<div class="panel" style="margin-top:18px;"><div class="panel-header"><div><p class="eyebrow">Local-first Notes</p><h3>What this product guarantees</h3></div></div><ul class="warning-list"><li>All modules work by opening <strong>index.html</strong> directly.</li><li>Data persists in <strong>localStorage</strong> with export, import, overwrite warning, and full reset.</li><li>Reports export as standalone HTML files for stakeholders, clients, or internal archives.</li></ul></div>' +
        '<div class="inline-actions" style="margin-top:18px;"><button class="button button-ghost" data-action="reset-workspace">Reset Workspace</button></div>' +
      '</section>'
    );
  }

  function renderFilterSummary() {
    if (!ui.search && ui.assigneeFilter === "all" && ui.viewFilter === "all") return "";
    var summary = [];
    if (ui.search) summary.push('Search: "' + escapeHtml(ui.search) + '"');
    if (ui.assigneeFilter !== "all") summary.push("Assignee filter active");
    if (ui.viewFilter !== "all") summary.push("View: " + escapeHtml(ui.viewFilter));
    return '<section class="panel filter-summary-panel"><div class="panel-header"><div><p class="eyebrow">Active Filters</p><h3>' + summary.join(" • ") + '</h3></div><button class="button button-ghost" data-action="clear-search">Clear filters</button></div></section>';
  }

  function renderContentCard(item) {
    var readiness = computeReadiness(item);
    var overdue = isOverdue(item.deadline);
    var progress = Math.round(((STAGES.indexOf(item.stage) + 1) / STAGES.length) * 100);
    return (
      '<article class="content-card" draggable="true" data-drag-content="' + item.id + '">' +
        '<div class="entity-head"><h4 class="card-title">' + escapeHtml(item.title) + '</h4><span class="priority-badge ' + priorityClass(item.priority) + '">' + escapeHtml(item.priority) + '</span></div>' +
        '<div class="card-meta">' +
          '<span class="mini-badge">' + escapeHtml(item.platform) + '</span>' +
          '<span class="mini-badge">' + escapeHtml(getMemberName(item.assigneeId)) + '</span>' +
          '<span class="readiness-badge ' + readiness.tone + '">' + escapeHtml(readiness.label) + '</span>' +
        '</div>' +
        '<div class="micro-progress" style="margin:12px 0 10px;"><span style="width:' + progress + '%"></span></div>' +
        '<div class="helper-text">' + escapeHtml(item.blocker || "No blockers logged.") + '</div>' +
        '<div class="meta-row" style="margin-top:10px;"><span class="mini-badge ' + (overdue ? "is-danger" : "is-info") + '">' + formatDate(item.deadline) + '</span><span class="mini-badge">Readiness ' + readiness.score + '/100</span></div>' +
        '<div class="inline-actions" style="margin-top:12px;"><button class="button button-ghost" data-action="open-content" data-id="' + item.id + '">Open</button><button class="button button-ghost" data-action="create-report-from-content" data-id="' + item.id + '">Export plan</button></div>' +
      '</article>'
    );
  }

  function renderInsightRow(item) {
    return (
      '<article class="insight-card insight-card-compact ' + item.tone + '">' +
        '<div class="insight-topline"><span class="severity-marker ' + item.tone + '">' + escapeHtml(item.marker) + '</span><span class="trend-pill">' + escapeHtml(item.trend) + '</span></div>' +
        '<div class="entity-head"><h4>' + escapeHtml(item.title) + '</h4><span class="status-badge ' + item.tone + '">' + escapeHtml(item.severity) + '</span></div>' +
        '<p class="helper-text">' + escapeHtml(item.shortReason || item.reason) + '</p>' +
        '<div class="insight-meta-grid insight-meta-grid-compact">' +
          '<div class="insight-meta-card"><span>Timeline</span><strong>' + escapeHtml(item.timeline) + '</strong></div>' +
          '<div class="insight-meta-card"><span>Pressure</span><strong>' + escapeHtml(item.pressure) + '</strong></div>' +
        '</div>' +
        '<div class="helper-text"><strong>Next move:</strong> ' + escapeHtml(item.shortAction || item.action) + '</div>' +
        '<div class="inline-actions" style="margin-top:10px;">' +
          (item.cta ? '<button class="button button-primary" data-action="apply-insight-action" data-id="' + item.id + '" data-value="' + item.cta + '">' + escapeHtml(item.primaryLabel) + '</button>' : "") +
          (item.secondaryCta ? '<button class="button button-ghost" data-action="apply-insight-action" data-id="' + item.id + '" data-value="' + item.secondaryCta + '">' + escapeHtml(item.secondaryLabel) + '</button>' : "") +
        '</div>' +
      '</article>'
    );
  }

  function renderOpportunityRow(item) {
    var score = computeViralScore(item);
    return '<div class="list-item signal-row signal-row-compact"><div class="entity-head"><h4>' + escapeHtml(item.title) + '</h4><span class="score-badge">' + score.total + '/100</span></div><div class="helper-text">' + escapeHtml(item.platform) + ' • ' + escapeHtml(score.recommendations[0]) + '</div><div class="inline-actions" style="margin-top:10px;"><button class="button button-ghost" data-action="jump-content-route" data-id="' + item.id + '" data-value="viral">Generate alternatives</button><button class="button button-ghost" data-action="open-content" data-id="' + item.id + '">Open workflow</button></div></div>';
  }

  function renderReadinessRow(item) {
    var readiness = computeReadiness(item);
    return '<div class="list-item signal-row signal-row-compact"><div class="entity-head"><h4>' + escapeHtml(item.title) + '</h4><span class="readiness-badge ' + readiness.tone + '">' + readiness.label + '</span></div><div class="helper-text">' + escapeHtml(readiness.summary) + '</div><div class="inline-actions" style="margin-top:10px;"><button class="button button-ghost" data-action="open-content" data-id="' + item.id + '">Fix now</button></div></div>';
  }

  function renderHookRow(hook) {
    var analysis = analyzeHookDraft(hook.text);
    return (
      '<div class="vault-item">' +
        '<div class="entity-head"><h4>' + escapeHtml(hook.category) + '</h4><span class="score-badge">' + analysis.total + '/100</span></div>' +
        '<p>' + escapeHtml(hook.text) + '</p>' +
        '<div class="meta-row"><span class="mini-badge">' + escapeHtml(hook.platform) + '</span><span class="mini-badge">' + (hook.favorite ? "Favorite" : "Saved") + '</span></div>' +
        '<div class="inline-actions"><button class="button button-ghost" data-action="load-hook-draft" data-id="' + hook.id + '">Load draft</button><button class="button button-ghost" data-action="open-hook-builder" data-id="' + hook.id + '">Edit</button><button class="button button-ghost" data-action="toggle-favorite-hook" data-id="' + hook.id + '">' + (hook.favorite ? "Unfavorite" : "Favorite") + '</button><button class="button button-ghost" data-action="duplicate-hook" data-id="' + hook.id + '">Send to vault</button><button class="button button-ghost" data-action="delete-hook" data-id="' + hook.id + '">Delete</button></div>' +
      '</div>'
    );
  }

  function renderCampaignRow(campaign) {
    return '<div class="list-item"><div class="entity-head"><h4>' + escapeHtml(campaign.name) + '</h4><span class="score-badge">' + campaign.progress + '%</span></div><div class="helper-text">' + escapeHtml(campaign.offer) + ' • deadline ' + formatDate(campaign.deadline) + '</div><div class="micro-progress" style="margin-top:10px;"><span style="width:' + campaign.progress + '%"></span></div><div class="inline-actions" style="margin-top:12px;"><button class="button button-ghost" data-action="set-selected-campaign" data-id="' + campaign.id + '">Select</button><button class="button button-ghost" data-action="open-campaign" data-id="' + campaign.id + '">Open</button></div></div>';
  }

  function renderSponsorRow(sponsor) {
    return '<div class="list-item"><div class="entity-head"><h4>' + escapeHtml(sponsor.name) + '</h4><span class="status-badge ' + approvalClass(sponsor.approval) + '">' + escapeHtml(sponsor.approval) + '</span></div><div class="helper-text">$' + sponsor.value.toLocaleString() + ' • ' + escapeHtml(sponsor.paymentStatus) + ' • due ' + formatDate(sponsor.deadline) + '</div><div class="inline-actions" style="margin-top:12px;"><button class="button button-ghost" data-action="set-selected-sponsor" data-id="' + sponsor.id + '">Select</button><button class="button button-ghost" data-action="open-sponsor" data-id="' + sponsor.id + '">Open</button></div></div>';
  }

  function renderApprovalRow(item) {
    return '<div class="approval-card"><div class="entity-head"><h4>' + escapeHtml(item.title) + '</h4><span class="status-badge ' + approvalClass(item.status) + '">' + escapeHtml(item.status) + '</span></div><div class="helper-text">' + escapeHtml(item.owner) + ' • ' + escapeHtml(item.note) + '</div><div class="inline-actions" style="margin-top:12px;"><button class="button button-ghost" data-action="toggle-approval" data-id="' + item.id + '">Advance state</button></div></div>';
  }

  function renderNoteRow(note) {
    return '<div class="team-note"><div class="entity-head"><h4>' + escapeHtml(note.title) + '</h4><span class="status-badge ' + (note.done ? "is-success" : "is-warning") + '">' + (note.done ? "Closed" : "Open") + '</span></div><p class="helper-text">' + escapeHtml(note.body) + '</p><div class="meta-row"><span class="mini-badge">' + escapeHtml(getMemberName(note.assigneeId)) + '</span><span class="mini-badge">' + escapeHtml(note.type) + '</span></div><div class="inline-actions" style="margin-top:12px;"><button class="button button-ghost" data-action="complete-note" data-id="' + note.id + '">' + (note.done ? "Reopen" : "Complete") + '</button><button class="button button-ghost" data-action="open-team-note" data-id="' + note.id + '">Edit</button><button class="button button-ghost" data-action="delete-note" data-id="' + note.id + '">Delete</button></div></div>';
  }

  function renderVaultRow(item) {
    return '<div class="vault-item"><div class="entity-head"><h4>' + escapeHtml(item.title) + '</h4><span class="mini-badge">' + escapeHtml(item.category) + '</span></div><p class="helper-text">' + escapeHtml(item.content) + '</p><div class="meta-row">' + item.tags.map(function (tag) { return '<span class="mini-badge">#' + escapeHtml(tag) + '</span>'; }).join("") + '<span class="mini-badge">' + (item.favorite ? "Favorite" : "Saved") + '</span></div><div class="inline-actions" style="margin-top:12px;"><button class="button button-ghost" data-action="toggle-vault-favorite" data-id="' + item.id + '">' + (item.favorite ? "Unfavorite" : "Favorite") + '</button><button class="button button-ghost" data-action="open-vault-item" data-id="' + item.id + '">Edit</button><button class="button button-ghost" data-action="delete-vault" data-id="' + item.id + '">Delete</button></div></div>';
  }

  function renderReportCard(title, type, body) {
    return '<div class="report-item"><h4>' + escapeHtml(title) + '</h4><p class="helper-text">' + escapeHtml(body) + '</p><button class="button button-primary" data-action="export-report" data-value="' + type + '">Generate HTML</button></div>';
  }

  function renderReportHistory(report) {
    return '<div class="report-item"><h4>' + escapeHtml(report.name) + '</h4><div class="helper-text">' + escapeHtml(report.createdAt) + '</div></div>';
  }

  function renderCalendarDay(day) {
    var cls = "calendar-day";
    if (day.gap) cls += " is-gap";
    if (day.burnout) cls += " is-overloaded";
    return '<div class="' + cls + '"><div class="calendar-day-header"><span>' + escapeHtml(day.label) + '</span><span class="helper-text">' + day.events.length + '</span></div>' + (day.events.length ? day.events.map(function (event) { return '<div class="calendar-event">' + escapeHtml(event) + '</div>'; }).join("") : '<div class="helper-text">No scheduled publish</div>') + '</div>';
  }

  function renderTimelineItem(item) {
    var tone = inferActivityTone(item);
    return '<div class="timeline-item ' + tone + '"><div class="timeline-row"><strong>' + escapeHtml(item.title) + '</strong><div class="timeline-meta"><span class="mini-badge ' + tone + '">' + escapeHtml(getActivityFilterLabel(item)) + '</span><span class="timeline-badge ' + tone + '">' + escapeHtml(item.when) + '</span></div></div><div class="helper-text">' + escapeHtml(item.detail) + '</div></div>';
  }

  function getDashboardActivity(filter) {
    return state.activity.filter(function (item) {
      var kind = getActivityFilterLabel(item).toLowerCase();
      if (!filter || filter === "all") return true;
      if (filter === "published") return kind === "published";
      if (filter === "delivery") return kind === "delivery";
      if (filter === "risk") return kind === "risk";
      return true;
    });
  }

  function getActivityFilterLabel(item) {
    var text = (String(item.title || "") + " " + String(item.detail || "")).toLowerCase();
    if (containsAny(text, ["published", "improved", "completed", "paid"])) return "Published";
    if (containsAny(text, ["sponsor", "approval", "review", "delivery"])) return "Delivery";
    if (containsAny(text, ["risk", "blocked", "delay", "overdue", "slow"])) return "Risk";
    return "Flow";
  }

  function renderPulseItem(label, value, tone, detail) {
    return '<div class="pulse-item ' + tone + '"><div class="pulse-topline"><span class="severity-dot ' + tone + '"></span><div class="helper-text">' + escapeHtml(label) + '</div></div><strong class="' + tone + '">' + escapeHtml(value) + '</strong>' + (detail ? '<div class="helper-text pulse-detail">' + escapeHtml(detail) + '</div>' : "") + '</div>';
  }

  function renderDistributionBars(map) {
    var keys = Object.keys(map || {});
    if (!keys.length) return renderEmpty("No distribution data", "Schedule or publish content items to populate channel balance insights.");
    var total = keys.reduce(function (sum, key) { return sum + map[key]; }, 0);
    return '<div class="distribution-cluster">' + keys.sort(function (a, b) { return map[b] - map[a]; }).map(function (key) {
      var share = Math.round((map[key] / total) * 100);
      var dominant = share >= 45;
      var pressure = dominant ? "Primary load" : share >= 25 ? "Core support" : "Expansion lane";
      return '<div class="distribution-row' + (dominant ? ' is-dominant' : '') + '"><div class="distribution-head"><div><strong>' + escapeHtml(key) + '</strong><div class="helper-text">' + pressure + ' • ' + map[key] + ' active items</div></div><div class="distribution-meta"><span class="mini-badge">' + share + '% share</span><span class="mini-badge ' + (dominant ? "is-warning" : "is-info") + '">' + (dominant ? "Dependency risk" : "Healthy mix") + '</span></div></div><div class="spark-bar"><span style="width:' + share + '%"></span></div></div>';
    }).join("") + '</div>';
  }

  function renderMetricCard(label, value, trend, body, tone) {
    return '<section class="metric-card ' + (tone || "") + '"><div class="metric-card-top"><p class="eyebrow">' + escapeHtml(label) + '</p><span class="severity-dot ' + escapeHtml(tone || "is-info") + '"></span></div><strong>' + escapeHtml(value) + '</strong><div class="metric-trend">' + escapeHtml(trend) + '</div><p class="metric-footnote">' + escapeHtml(body) + '</p></section>';
  }

  function renderHeroSignal(label, value, detail, tone) {
    return '<div class="hero-signal ' + (tone || "is-info") + '"><div class="hero-signal-top"><span class="severity-dot ' + (tone || "is-info") + '"></span><span class="hero-signal-label">' + escapeHtml(label) + '</span></div><strong>' + escapeHtml(value) + '</strong><p class="helper-text">' + escapeHtml(detail) + '</p></div>';
  }

  function renderRailCard(label, value, detail, tone) {
    return '<div class="rail-card ' + (tone || "is-info") + '"><div class="entity-head"><span class="helper-text">' + escapeHtml(label) + '</span><span class="status-badge ' + (tone || "is-info") + '">' + escapeHtml(value) + '</span></div><p class="helper-text">' + escapeHtml(detail) + '</p></div>';
  }

  function renderPressureCard(label, value, detail, tone) {
    return '<div class="pressure-card ' + (tone || "is-info") + '"><span class="helper-text">' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong><p class="helper-text">' + escapeHtml(detail) + '</p></div>';
  }

  function renderTopInsight(item) {
    return '<div class="top-insight ' + item.tone + '"><div class="top-insight-head"><span class="severity-marker ' + item.tone + '">' + escapeHtml(item.marker) + '</span><span class="trend-pill">' + escapeHtml(item.timeline) + '</span></div><h4>' + escapeHtml(item.title) + '</h4><p class="helper-text">' + escapeHtml(item.shortReason || item.reason) + '</p><div class="helper-text"><strong>Next move:</strong> ' + escapeHtml(item.shortAction || item.action) + '</div><div class="inline-actions" style="margin-top:12px;">' + (item.cta ? '<button class="button button-primary" data-action="apply-insight-action" data-id="' + item.id + '" data-value="' + item.cta + '">' + escapeHtml(item.primaryLabel) + '</button>' : '') + (item.secondaryCta ? '<button class="button button-ghost" data-action="apply-insight-action" data-id="' + item.id + '" data-value="' + item.secondaryCta + '">' + escapeHtml(item.secondaryLabel) + '</button>' : '') + '</div></div>';
  }

  function renderMiniMetric(label, value) {
    return '<div class="card"><p class="eyebrow">' + escapeHtml(label) + '</p><h4>' + escapeHtml(value) + '</h4></div>';
  }

  function renderSplitStat(label, value) {
    return '<div class="split-stat"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
  }

    function renderEmpty(title, body) {
      return '<div class="empty-state"><span class="empty-state-label">Next best move</span><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(body) + '</p></div>';
    }

  function renderContentSelector(id, selectedId) {
    if (!state.content.length) return '<label class="field"><span class="field-title">Select content item</span><select id="' + id + '" disabled><option>No content items available</option></select></label>';
    return '<label class="field"><span class="field-title">Select content item</span><select id="' + id + '">' + state.content.map(function (item) {
      var selected = item.id === selectedId ? ' selected' : "";
      return '<option value="' + item.id + '"' + selected + '>' + escapeHtml(item.title) + ' • ' + escapeHtml(item.platform) + '</option>';
    }).join("") + '</select></label>';
  }

  function renderCampaignSelector() {
    if (!state.campaigns.length) return '<label class="field"><span class="field-title">Selected campaign</span><select id="campaignSelect" disabled><option>No campaigns available</option></select></label>';
    return '<label class="field"><span class="field-title">Selected campaign</span><select id="campaignSelect">' + state.campaigns.map(function (item) {
      var selected = item.id === ui.selectedCampaignId ? ' selected' : "";
      return '<option value="' + item.id + '"' + selected + '>' + escapeHtml(item.name) + '</option>';
    }).join("") + '</select></label>';
  }

  function renderSponsorSelector() {
    if (!state.sponsors.length) return '<label class="field"><span class="field-title">Selected sponsor</span><select id="sponsorSelect" disabled><option>No sponsors available</option></select></label>';
    return '<label class="field"><span class="field-title">Selected sponsor</span><select id="sponsorSelect">' + state.sponsors.map(function (item) {
      var selected = item.id === ui.selectedSponsorId ? ' selected' : "";
      return '<option value="' + item.id + '"' + selected + '>' + escapeHtml(item.name) + '</option>';
    }).join("") + '</select></label>';
  }

  function renderScriptSelector() {
    if (!state.scripts.length) return '<label class="field"><span class="field-title">Selected script</span><select id="scriptSelect" disabled><option>No scripts available</option></select></label>';
    return '<label class="field"><span class="field-title">Selected script</span><select id="scriptSelect">' + state.scripts.map(function (item) {
      var selected = item.id === ui.selectedScriptId ? ' selected' : "";
      return '<option value="' + item.id + '"' + selected + '>' + escapeHtml(item.title) + '</option>';
    }).join("") + '</select></label>';
  }

  function renderPalette() {
    var items = buildPaletteItems().filter(function (item) {
      if (!ui.paletteSearch) return true;
      return (item.title + " " + item.body).toLowerCase().indexOf(ui.paletteSearch) > -1;
    });
    els.paletteResults.innerHTML = items.map(function (item) {
      return '<button class="palette-item" data-palette-action="' + item.action + '" data-value="' + escapeHtml(item.value || "") + '"><strong>' + escapeHtml(item.title) + '</strong><span class="helper-text">' + escapeHtml(item.body) + '</span></button>';
    }).join("");
  }

  function renderNotifications() {
    els.notificationList.innerHTML = getAlerts(true).map(function (item) {
      return '<div class="notification-item"><div class="entity-head"><h4>' + escapeHtml(item.title) + '</h4><span class="status-badge ' + item.tone + '">' + escapeHtml(item.label) + '</span></div><p class="helper-text">' + escapeHtml(item.detail) + '</p><div class="inline-actions">' + (item.action ? '<button class="button button-ghost" data-action="apply-insight-action" data-id="' + item.id + '" data-value="' + item.action + '">Open related item</button>' : "") + '<button class="button button-ghost" data-action="archive-notification" data-id="' + item.id + '">Archive</button></div></div>';
    }).join("") || renderEmpty("No alerts", "There are no active items in the notification center.");
  }

  function buildPaletteItems() {
    return [
      { action: "route", value: "dashboard", title: "Open dashboard", body: "Jump to operational metrics and insight engine." },
      { action: "route", value: "pipeline", title: "Open pipeline", body: "Manage cards and drag content across stages." },
      { action: "route", value: "calendar", title: "Open calendar", body: "Review publishing gaps and overload." },
      { action: "route", value: "reports", title: "Open reports", body: "Generate HTML reports and backups." },
      { action: "quick-add", value: "content", title: "Create content item", body: "Add a new piece to the production queue." },
      { action: "quick-add", value: "campaign", title: "Build campaign", body: "Create an offer and publishing sequence." },
      { action: "quick-add", value: "sponsor", title: "Add sponsor deal", body: "Track a new revenue deliverable set." },
      { action: "quick-add", value: "hook-ideas", title: "Generate hook ideas", body: "Create hook directions from the current selected content item." },
      { action: "export", value: "weekly", title: "Export weekly report", body: "Generate the weekly creator operations report." },
      { action: "theme", value: "", title: "Toggle theme", body: "Switch between dark and light mode." }
    ];
  }

  function runPaletteAction(action, value) {
    if (action === "route") window.location.hash = value;
    else if (action === "quick-add") openQuickCreateForm(value);
    else if (action === "export") exportReport(value);
    else if (action === "theme") {
      mutate("Theme updated", function () {
        state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
      }, { quiet: true });
      applyTheme();
      render();
    }
    closePalette();
  }

  function openPalette() {
    ui.paletteSearch = "";
    els.paletteSearch.value = "";
    els.paletteBackdrop.classList.remove("hidden");
    els.paletteSearch.focus();
    renderPalette();
  }

  function closePalette() {
    els.paletteBackdrop.classList.add("hidden");
  }

  function openNotifications() {
    ui.notificationOpen = true;
    els.notificationDrawer.classList.remove("hidden");
    renderNotifications();
  }

  function closeNotifications() {
    ui.notificationOpen = false;
    els.notificationDrawer.classList.add("hidden");
  }

  function openModal(title, eyebrow, bodyHtml) {
    els.modalTitle.textContent = title;
    els.modalEyebrow.textContent = eyebrow;
    els.modalBody.innerHTML = bodyHtml;
    els.modalBackdrop.classList.remove("hidden");
  }

  function closeModal() {
    els.modalBackdrop.classList.add("hidden");
    els.modalBody.innerHTML = "";
  }

  function openQuickAddModal() {
    openModal("Quick Actions", "Workspace Actions",
      '<div class="card-grid">' +
        quickAction("Create Content Item", "Add a production asset with assignee, deadline, and platform context.", "content") +
        quickAction("Generate Hook Ideas", "Generate hook options from the currently selected content angle.", "hook-ideas") +
        quickAction("Build Campaign", "Create a launch sequence with milestones and offer framing.", "campaign") +
        quickAction("Add Sponsor Deal", "Track deliverables, approvals, and payment state.", "sponsor") +
        quickAction("Export Report", "Jump to reports and generate stakeholder-ready HTML.", "report") +
        quickAction("Review Blockers", "Open the notification center and insight engine.", "alerts") +
        quickAction("Fix Low Score Items", "Jump to the lowest-scoring opportunity item.", "fix") +
        quickAction("Open Calendar", "Review publishing balance and workload spread.", "calendar") +
      '</div>'
    );
  }

  function quickAction(title, body, type) {
    return '<button class="quick-action" data-action="quick-add-type" data-value="' + type + '"><strong>' + escapeHtml(title) + '</strong><span class="helper-text">' + escapeHtml(body) + '</span></button>';
  }

  function openQuickCreateForm(type) {
    if (type === "content") openContentModal();
    else if (type === "hook") openHookBuilderModal();
    else if (type === "hook-ideas") { closeModal(); generateHookIdeasForSelected(); }
    else if (type === "campaign") openCampaignModal();
    else if (type === "sponsor") openSponsorModal();
    else if (type === "note") openTeamNoteModal();
    else if (type === "vault") openVaultModal();
    else if (type === "report") { closeModal(); window.location.hash = "reports"; }
    else if (type === "alerts") { closeModal(); openNotifications(); }
    else if (type === "fix") { closeModal(); jumpToLowestScoringItem(); }
    else if (type === "calendar") { closeModal(); window.location.hash = "calendar"; }
  }

  function openContentModal(id) {
    var item = id ? findById(state.content, id) : null;
    var value = item || createEmptyContent();
    openModal(item ? "Edit Content Item" : "Create Content Item", "Content Pipeline",
      '<form data-form="content" class="form-grid">' +
        hiddenField("id", value.id) +
        fieldInput("Title", "title", value.title, "field-full") +
        fieldTextarea("Description", "description", value.description, "field-full") +
        fieldSelect("Platform", "platform", PLATFORMS, value.platform) +
        fieldSelect("Stage", "stage", STAGES, value.stage) +
        fieldSelect("Assignee", "assigneeId", state.team.map(function (member) { return { value: member.id, label: member.name }; }), value.assigneeId) +
        fieldInput("Deadline", "deadline", value.deadline, "", "date") +
        fieldSelect("Priority", "priority", ["Low", "Medium", "High", "Critical"], value.priority) +
        fieldInput("Topic", "topic", value.topic, "field-full") +
        fieldInput("Dependencies", "dependencies", value.dependencies.join(", "), "field-full") +
        fieldInput("Blocker", "blocker", value.blocker, "field-full") +
        fieldInput("Hook", "hook", value.hook, "field-full") +
        fieldInput("CTA", "cta", value.cta, "field-full") +
        fieldSelect("Campaign", "campaignId", [{ value: "", label: "None" }].concat(state.campaigns.map(function (campaign) { return { value: campaign.id, label: campaign.name }; })), value.campaignId) +
        fieldSelect("Sponsor", "sponsorId", [{ value: "", label: "None" }].concat(state.sponsors.map(function (sponsor) { return { value: sponsor.id, label: sponsor.name }; })), value.sponsorId) +
        formActions("Save Content Item", item ? '<button class="button button-ghost" type="button" data-action="delete-content" data-id="' + item.id + '">Delete</button>' : "") +
      '</form>'
    );
  }

  function openHookBuilderModal(id) {
    var hook = id ? findById(state.hooks, id) : null;
    var selected = getSelectedContent();
    var value = hook || { id: "", text: ui.selectedHookDraft || (selected ? selected.hook : ""), category: "Curiosity", platform: selected ? selected.platform : "YouTube", favorite: false };
    var analysis = analyzeHookDraft(value.text);
    openModal(hook ? "Edit Hook" : "Save Hook", "Hook Laboratory",
      '<form data-form="hook" class="form-grid">' +
        hiddenField("id", value.id) +
        fieldTextarea("Hook", "text", value.text, "field-full") +
        fieldSelect("Category", "category", ["Curiosity", "Controversy", "Authority", "Storytelling", "Urgency", "Emotional", "FOMO", "Problem/Solution"], value.category) +
        fieldSelect("Platform", "platform", PLATFORMS, value.platform) +
        fieldSelect("Favorite", "favorite", [{ value: "false", label: "Saved" }, { value: "true", label: "Favorite" }], String(value.favorite)) +
        '<div class="field field-full"><span class="field-title">Live analysis</span><div class="card"><strong>' + analysis.total + '/100</strong><p class="helper-text">' + escapeHtml(analysis.summary) + '</p></div></div>' +
        formActions("Save Hook", hook ? '<button class="button button-ghost" type="button" data-action="delete-hook" data-id="' + hook.id + '">Delete</button>' : "") +
      '</form>'
    );
  }

  function openScriptEditor(id) {
    var script = id ? findById(state.scripts, id) : null;
    if (!script && !state.content.length) return toast("No content available", "Create a content item before building a script.");
    var value = script || createEmptyScript();
    openModal(script ? "Edit Script" : "Create Script", "Script Studio",
      '<form data-form="script" class="form-grid">' +
        hiddenField("id", value.id) +
        fieldInput("Title", "title", value.title, "field-full") +
        fieldSelect("Content Item", "contentId", state.content.map(function (item) { return { value: item.id, label: item.title }; }), value.contentId) +
        fieldTextarea("Hook Section", "hook", value.sections.hook) +
        fieldTextarea("Intro Section", "intro", value.sections.intro) +
        fieldTextarea("Story Section", "story", value.sections.story) +
        fieldTextarea("Main Value Section", "value", value.sections.value) +
        fieldTextarea("Proof Section", "proof", value.sections.proof) +
        fieldTextarea("CTA Section", "cta", value.sections.cta) +
        formActions("Save Script", script ? '<button class="button button-ghost" type="button" data-action="delete-script" data-id="' + script.id + '">Delete</button>' : "") +
      '</form>'
    );
  }

  function openThumbnailPlanner(id) {
    var item = id ? findById(state.content, id) : getSelectedContent();
    if (!item) return toast("No content selected", "Create or select a content item before editing thumbnail strategy.");
    openModal("Thumbnail Strategy", "Thumbnail Engine",
      '<form data-form="thumbnail" class="form-grid">' +
        hiddenField("id", item.id) +
        fieldSelect("Emotional direction", "direction", ["Urgent", "Curious", "Authority", "Shock", "Relief", "Transformation"], item.thumbnailPlan.direction) +
        fieldSelect("Text placement", "textPlacement", ["Left focus", "Right focus", "Top banner", "Bottom tag", "Minimal text"], item.thumbnailPlan.textPlacement) +
        fieldSelect("Clutter level", "clutter", ["Minimal", "Balanced", "Busy"], item.thumbnailPlan.clutter) +
        fieldSelect("Visual focus", "focus", ["Face reaction", "Object contrast", "Result reveal", "Before/after", "Big claim"], item.thumbnailPlan.focus) +
        formActions("Save Strategy") +
      '</form>'
    );
  }

  function openCampaignModal(id) {
    var item = id ? findById(state.campaigns, id) : null;
    var value = item || createEmptyCampaign();
    openModal(item ? "Edit Campaign" : "Build Campaign", "Campaign Command Center",
      '<form data-form="campaign" class="form-grid">' +
        hiddenField("id", value.id) +
        fieldInput("Campaign name", "name", value.name, "field-full") +
        fieldInput("Offer", "offer", value.offer) +
        fieldInput("Wave label", "waveLabel", value.waveLabel) +
        fieldInput("Deadline", "deadline", value.deadline, "", "date") +
        fieldInput("Progress", "progress", String(value.progress), "", "number") +
        fieldTextarea("Sequence items", "sequence", value.sequence.join("\n"), "field-full") +
        formActions("Save Campaign", item ? '<button class="button button-ghost" type="button" data-action="delete-campaign" data-id="' + item.id + '">Delete</button>' : "") +
      '</form>'
    );
  }

  function openSponsorModal(id) {
    var item = id ? findById(state.sponsors, id) : null;
    var value = item || createEmptySponsor();
    openModal(item ? "Edit Sponsor Deal" : "Add Sponsor Deal", "Sponsor Operations",
      '<form data-form="sponsor" class="form-grid">' +
        hiddenField("id", value.id) +
        fieldInput("Sponsor name", "name", value.name, "field-full") +
        fieldInput("Deal value", "value", String(value.value), "", "number") +
        fieldSelect("Approval", "approval", ["Briefing", "Review", "Approved"], value.approval) +
        fieldSelect("Payment status", "paymentStatus", ["Pending", "Invoiced", "Paid"], value.paymentStatus) +
        fieldInput("Deadline", "deadline", value.deadline, "", "date") +
        fieldTextarea("Deliverables", "deliverables", value.deliverables.join("\n"), "field-full") +
        fieldTextarea("Notes", "notes", value.notes, "field-full") +
        formActions("Save Sponsor Deal", item ? '<button class="button button-ghost" type="button" data-action="delete-sponsor" data-id="' + item.id + '">Delete</button>' : "") +
      '</form>'
    );
  }

  function openTeamNoteModal(id) {
    var item = id ? findById(state.notes, id) : null;
    var value = item || createEmptyNote();
    openModal(item ? "Edit Team Note" : "Add Team Note", "Team Workspace",
      '<form data-form="note" class="form-grid">' +
        hiddenField("id", value.id) +
        fieldInput("Title", "title", value.title, "field-full") +
        fieldTextarea("Body", "body", value.body, "field-full") +
        fieldSelect("Assignee", "assigneeId", state.team.map(function (member) { return { value: member.id, label: member.name }; }), value.assigneeId) +
        fieldSelect("Type", "type", ["Review", "Blocker", "Approval", "Strategy"], value.type) +
        fieldSelect("Done", "done", [{ value: "false", label: "Open" }, { value: "true", label: "Closed" }], String(value.done)) +
        formActions("Save Team Note", item ? '<button class="button button-ghost" type="button" data-action="delete-note" data-id="' + item.id + '">Delete</button>' : "") +
      '</form>'
    );
  }

  function openVaultModal(id) {
    var item = id ? findById(state.vault, id) : null;
    var value = item || createEmptyVaultItem();
    openModal(item ? "Edit Vault Item" : "Add Vault Item", "Swipe Vault",
      '<form data-form="vault" class="form-grid">' +
        hiddenField("id", value.id) +
        fieldInput("Title", "title", value.title, "field-full") +
        fieldSelect("Category", "category", ["Hook", "CTA", "Title", "Campaign Idea", "Thumbnail Concept"], value.category) +
        fieldSelect("Favorite", "favorite", [{ value: "false", label: "Saved" }, { value: "true", label: "Favorite" }], String(Boolean(value.favorite))) +
        fieldInput("Tags", "tags", value.tags.join(", "), "field-full") +
        fieldTextarea("Content", "content", value.content, "field-full") +
        formActions("Save Vault Item", item ? '<button class="button button-ghost" type="button" data-action="delete-vault" data-id="' + item.id + '">Delete</button>' : "") +
      '</form>'
    );
  }

  function openShortcutsModal() {
    openModal("Keyboard Shortcuts", "Workspace", '<ul class="shortcut-list">' +
      '<li><span>Open command palette</span><kbd>Ctrl/Cmd + K</kbd></li>' +
      '<li><span>Quick add</span><kbd>Ctrl/Cmd + N</kbd></li>' +
      '<li><span>Focus global search</span><kbd>/</kbd></li>' +
      '<li><span>Save</span><kbd>Ctrl/Cmd + S</kbd></li>' +
      '<li><span>Undo</span><kbd>Ctrl/Cmd + Z</kbd></li>' +
      '<li><span>Close overlays</span><kbd>Esc</kbd></li>' +
    '</ul>');
  }

  function openConfirmModal(title, body, confirmLabel, callback) {
    openModal(title, "Confirmation",
      '<div class="stack"><p class="helper-text">' + escapeHtml(body) + '</p><div class="inline-actions"><button class="button button-primary" data-action="confirm-modal">' + escapeHtml(confirmLabel) + '</button><button class="button button-ghost" data-action="close-modal">Cancel</button></div></div>'
    );
    var confirm = els.modalBody.querySelector('[data-action="confirm-modal"]');
    if (confirm) confirm.addEventListener("click", callback, { once: true });
  }

  function maybeStartWalkthrough(force) {
    if (isPreviewMode()) return;
    if (!force && state.settings.onboardingComplete) return;
    ui.walkthroughStep = 0;
    renderWalkthrough();
  }

  function renderWalkthrough() {
    var step = walkthroughSteps[ui.walkthroughStep];
    if (!step) return finishWalkthrough();
    els.walkthroughTitle.textContent = step.title;
    els.walkthroughBody.textContent = step.body;
    els.walkthrough.classList.remove("hidden");
  }

  function advanceWalkthrough() {
    ui.walkthroughStep += 1;
    if (ui.walkthroughStep >= walkthroughSteps.length) {
      finishWalkthrough();
      return;
    }
    renderWalkthrough();
  }

  function finishWalkthrough() {
    els.walkthrough.classList.add("hidden");
    mutate("Onboarding completed", function () {
      state.settings.onboardingComplete = true;
    }, { quiet: true, pushUndo: false });
  }

  function saveContent(data) {
    var error = validateContentData(data);
    if (error) return toast("Validation error", error);
    showLoadingToast("Saving content item");
    mutate("Content item saved", function () {
      var item = normalizeContentInput(data);
      upsertById(state.content, item);
      ui.selectedContentId = item.id;
      createActivity("Content item saved", item.title + " updated in " + item.stage + ".", "Just now");
    });
    closeModal();
    render();
  }

  function saveHook(data) {
    var hookText = String(data.text || "").trim();
    if (!hookText) return toast("Validation error", "Hook text is required.");
    if (hookText.length < 12) return toast("Validation error", "Hook text is too short to save as a useful asset.");
    var duplicate = state.hooks.some(function (hook) {
      return hook.id !== data.id && hook.text.trim().toLowerCase() === hookText.toLowerCase();
    });
    if (duplicate) {
      toast("Duplicate hook blocked", "That hook already exists in the Hook Laboratory.");
      return;
    }
    mutate("Hook saved", function () {
      var hook = {
        id: data.id || uid("hook"),
        text: hookText,
        category: String(data.category || "Curiosity"),
        platform: String(data.platform || "YouTube"),
        favorite: data.favorite === "true"
      };
      upsertById(state.hooks, hook);
      ui.selectedHookDraft = hook.text;
      createActivity("Hook saved", hook.category + " hook added to the lab.", "Just now");
    });
    closeModal();
    render();
  }

  function saveScript(data) {
    if (!String(data.title || "").trim()) return toast("Validation error", "Script title is required.");
    if (!String(data.contentId || "").trim()) return toast("Validation error", "A content item must exist before a script can be saved.");
    mutate("Script saved", function () {
      var script = {
        id: data.id || uid("script"),
        title: String(data.title || "Untitled Script").trim(),
        contentId: data.contentId,
        sections: {
          hook: String(data.hook || "").trim(),
          intro: String(data.intro || "").trim(),
          story: String(data.story || "").trim(),
          value: String(data.value || "").trim(),
          proof: String(data.proof || "").trim(),
          cta: String(data.cta || "").trim()
        }
      };
      upsertById(state.scripts, script);
      ui.selectedScriptId = script.id;
      createActivity("Script updated", script.title + " saved in Script Studio.", "Just now");
    });
    closeModal();
    render();
  }

  function saveCampaign(data) {
    if (!String(data.name || "").trim()) return toast("Validation error", "Campaign name is required.");
    if (!String(data.offer || "").trim()) return toast("Validation error", "Campaign offer is required.");
    mutate("Campaign saved", function () {
      var item = {
        id: data.id || uid("campaign"),
        name: String(data.name || "New Campaign").trim(),
        offer: String(data.offer || "Offer").trim(),
        waveLabel: String(data.waveLabel || "Wave").trim(),
        deadline: data.deadline || todayOffset(7),
        progress: clampNumber(Number(data.progress || 0), 0, 100),
        sequence: splitLines(data.sequence)
      };
      upsertById(state.campaigns, item);
      ui.selectedCampaignId = item.id;
      createActivity("Campaign updated", item.name + " sequence refreshed.", "Just now");
    });
    closeModal();
    render();
  }

  function saveSponsor(data) {
    if (!String(data.name || "").trim()) return toast("Validation error", "Sponsor name is required.");
    mutate("Sponsor saved", function () {
      var item = {
        id: data.id || uid("sponsor"),
        name: String(data.name || "New Sponsor").trim(),
        value: Math.max(0, Number(data.value || 0)),
        approval: String(data.approval || "Briefing"),
        paymentStatus: String(data.paymentStatus || "Pending"),
        deadline: data.deadline || todayOffset(7),
        deliverables: splitLines(data.deliverables),
        notes: String(data.notes || "").trim()
      };
      upsertById(state.sponsors, item);
      ui.selectedSponsorId = item.id;
      createActivity("Sponsor updated", item.name + " sponsor deal edited.", "Just now");
    });
    closeModal();
    render();
  }

  function saveTeamNote(data) {
    if (!String(data.title || "").trim()) return toast("Validation error", "Note title is required.");
    mutate("Team note saved", function () {
      var item = {
        id: data.id || uid("note"),
        title: String(data.title || "Untitled Note").trim(),
        body: String(data.body || "").trim(),
        assigneeId: data.assigneeId || state.team[0].id,
        type: String(data.type || "Review"),
        done: data.done === "true"
      };
      upsertById(state.notes, item);
      createActivity("Team note updated", item.title + " synced to team workspace.", "Just now");
    });
    closeModal();
    render();
  }

  function saveVaultItem(data) {
    if (!String(data.title || "").trim()) return toast("Validation error", "Vault item title is required.");
    if (!String(data.content || "").trim()) return toast("Validation error", "Vault item content is required.");
    mutate("Vault item saved", function () {
      var item = {
        id: data.id || uid("vault"),
        title: String(data.title || "New Asset").trim(),
        category: String(data.category || "Hook"),
        tags: splitTags(data.tags),
        content: String(data.content || "").trim(),
        favorite: data.favorite === "true"
      };
      upsertById(state.vault, item);
      createActivity("Vault updated", item.title + " saved to Swipe Vault.", "Just now");
    });
    closeModal();
    render();
  }

  function saveThumbnailPlan(data) {
    mutate("Thumbnail strategy saved", function () {
      var item = getContentById(data.id);
      if (!item) return;
      item.thumbnailPlan = {
        direction: String(data.direction || "Curious"),
        textPlacement: String(data.textPlacement || "Minimal text"),
        clutter: String(data.clutter || "Balanced"),
        focus: String(data.focus || "Result reveal")
      };
      createActivity("Thumbnail updated", item.title + " packaging direction refreshed.", "Just now");
    });
    closeModal();
    render();
  }

  function moveContentToStage(contentId, stage) {
    var item = getContentById(contentId);
    if (!item || item.stage === stage) return;
    mutate("Pipeline stage updated", function () {
      item.stage = stage;
      createActivity("Pipeline moved", item.title + " moved to " + stage + ".", "Just now");
    });
    render();
  }

  function toggleFavoriteHook(id) {
    mutate("Hook updated", function () {
      var hook = findById(state.hooks, id);
      if (!hook) return;
      hook.favorite = !hook.favorite;
    });
    render();
  }

  function loadHookDraft(id) {
    var hook = findById(state.hooks, id);
    ui.selectedHookDraft = hook ? hook.text : "";
    toast("Hook draft loaded", "The selected hook was moved into the live scoring workspace.");
    render();
  }

  function updateApproval(id) {
    mutate("Approval advanced", function () {
      var approval = findById(state.approvals, id);
      if (approval) approval.status = nextApprovalState(approval.status);
      else {
        var sponsor = findById(state.sponsors, id);
        if (sponsor) sponsor.approval = nextApprovalState(sponsor.approval);
      }
      createActivity("Approval advanced", "Approval state moved forward.", "Just now");
    });
    render();
  }

  function updateSponsorPayment(id) {
    mutate("Payment updated", function () {
      var sponsor = findById(state.sponsors, id);
      if (!sponsor) return;
      sponsor.paymentStatus = nextPaymentState(sponsor.paymentStatus);
      createActivity("Payment state advanced", sponsor.name + " payment moved to " + sponsor.paymentStatus + ".", "Just now");
    });
    render();
  }

  function toggleTeamNote(id) {
    mutate("Note updated", function () {
      var note = findById(state.notes, id);
      if (!note) return;
      note.done = !note.done;
    });
    render();
  }

  function duplicateHookIntoVault(id) {
    var hook = findById(state.hooks, id);
    if (!hook) return;
    mutate("Vault item saved", function () {
      state.vault.unshift({
        id: uid("vault"),
        title: hook.category + " hook",
        category: "Hook",
        tags: [hook.platform.toLowerCase().replace(/\s+/g, "-"), "hook"],
        content: hook.text
      });
    });
    render();
  }

  function exportContentPlanForContent(id) {
    var item = getContentById(id);
    if (!item) return;
    exportHtmlFile(item.title.replace(/\W+/g, "-").toLowerCase() + "-content-plan.html", buildSingleContentReport(item));
    mutate("Report exported", function () {
      state.reports.unshift({ id: uid("report"), name: item.title + " content plan", createdAt: formatStamp(new Date()) });
    }, { quiet: true, pushUndo: false });
    render();
  }

  function exportReport(type) {
    showLoadingToast("Generating report");
    var report = buildReport(type);
    exportHtmlFile(report.filename, report.html);
    mutate("Report exported", function () {
      state.reports.unshift({ id: uid("report"), name: report.title, createdAt: formatStamp(new Date()) });
      createActivity("Report generated", report.title + " exported as HTML.", "Just now");
    }, { quiet: true, pushUndo: false });
    render();
  }

  function exportWorkspaceJson() {
    var payload = JSON.stringify(Object.assign({ _meta: { product: "ContentPilot", version: "1.0.0", exportedAt: formatStamp(new Date()) } }, state), null, 2);
    downloadTextFile("contentpilot-workspace-backup.json", payload, "application/json");
    toast("Backup exported", "Workspace JSON was downloaded locally.");
  }

  function handleImportFile(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      try {
        var parsed = JSON.parse(String(loadEvent.target.result || "{}"));
        if (!isValidWorkspaceBackup(parsed)) throw new Error("INVALID_WORKSPACE");
        ui.pendingImport = normalizeWorkspace(parsed);
        openModal("Import Workspace", "Overwrite Protection", '<div class="stack"><p class="helper-text">This backup contains ' + ui.pendingImport.content.length + ' content items, ' + ui.pendingImport.campaigns.length + ' campaigns, and ' + ui.pendingImport.sponsors.length + ' sponsors. Applying it will replace the current workspace.</p><div class="inline-actions"><button class="button button-primary" data-action="apply-import">Apply Import</button><button class="button button-ghost" data-action="close-modal">Cancel</button></div></div>');
      } catch (error) {
        toast("Import failed", "The selected file is not a valid ContentPilot backup.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function applyPendingImport() {
    if (!ui.pendingImport) return;
    undoStack = [];
    state = normalizeWorkspace(ui.pendingImport);
    ui.pendingImport = null;
    saveState();
    ensureSelections();
    closeModal();
    render();
    toast("Workspace imported", "The backup replaced the current workspace successfully.");
  }

  function archiveNotification(id) {
    mutate("Notification archived", function () {
      state.archivedAlerts = state.archivedAlerts || [];
      if (state.archivedAlerts.indexOf(id) === -1) state.archivedAlerts.push(id);
    }, { quiet: true });
    renderNotifications();
    render();
  }

  function clearAllFilters() {
    ui.search = "";
    ui.assigneeFilter = "all";
    ui.viewFilter = "all";
    els.globalSearch.value = "";
    els.assigneeFilter.value = "all";
    render();
  }

  function performUndo() {
    if (!undoStack.length) {
      toast("Nothing to undo", "The workspace has no older snapshot in this session.");
      return;
    }
    state = normalizeWorkspace(JSON.parse(undoStack.pop()));
    saveState();
    ensureSelections();
    render();
    toast("Undo applied", "The previous workspace snapshot was restored.");
  }

  function mutate(successMessage, fn, options) {
    options = options || {};
    if (options.pushUndo !== false) {
      undoStack.push(JSON.stringify(state));
      if (undoStack.length > MAX_UNDO) undoStack.shift();
    }
    fn();
    saveState();
    if (!options.quiet) toast(successMessage, "ContentPilot saved the workspace automatically.");
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      toast("Save warning", "This browser prevented storage. ContentPilot still works for the current session.");
    }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : createSeedState();
    } catch (error) {
      return createSeedState();
    }
  }

  function normalizeWorkspace(workspace) {
    var seed = createSeedState();
    var merged = workspace && typeof workspace === "object" ? workspace : {};
    return {
      team: hasOwnList(merged, "team") ? merged.team : seed.team,
      content: hasOwnList(merged, "content") ? merged.content.map(normalizeContentRecord) : seed.content,
      hooks: hasOwnList(merged, "hooks") ? merged.hooks : seed.hooks,
      scripts: hasOwnList(merged, "scripts") ? merged.scripts.map(normalizeScriptRecord) : seed.scripts,
      campaigns: hasOwnList(merged, "campaigns") ? merged.campaigns : seed.campaigns,
      sponsors: hasOwnList(merged, "sponsors") ? merged.sponsors : seed.sponsors,
      approvals: hasOwnList(merged, "approvals") ? merged.approvals : seed.approvals,
      notes: hasOwnList(merged, "notes") ? merged.notes : seed.notes,
      vault: hasOwnList(merged, "vault") ? merged.vault.map(normalizeVaultRecord) : seed.vault,
      reports: Array.isArray(merged.reports) ? merged.reports : [],
      activity: hasOwnList(merged, "activity") ? merged.activity : seed.activity,
      settings: Object.assign({}, seed.settings, merged.settings || {}),
      archivedAlerts: Array.isArray(merged.archivedAlerts) ? merged.archivedAlerts : []
    };
  }

  function normalizeContentRecord(item) {
    var clean = item || {};
    return {
      id: clean.id || uid("content"),
      title: String(clean.title || "Untitled Item").trim(),
      description: String(clean.description || "").trim(),
      platform: String(clean.platform || "YouTube"),
      stage: STAGES.indexOf(clean.stage) > -1 ? clean.stage : "Idea",
      deadline: clean.deadline || todayOffset(7),
      priority: ["Low", "Medium", "High", "Critical"].indexOf(clean.priority) > -1 ? clean.priority : "Medium",
      assigneeId: clean.assigneeId || "team-1",
      topic: String(clean.topic || "").trim(),
      dependencies: Array.isArray(clean.dependencies) ? clean.dependencies : splitTags(clean.dependencies || ""),
      blocker: String(clean.blocker || "").trim(),
      hook: String(clean.hook || "").trim(),
      cta: String(clean.cta || "").trim(),
      campaignId: clean.campaignId || "",
      sponsorId: clean.sponsorId || "",
      lastOpportunityScore: Number(clean.lastOpportunityScore || 0),
      thumbnailPlan: clean.thumbnailPlan || {
        direction: "Curious",
        textPlacement: "Minimal text",
        clutter: "Balanced",
        focus: "Result reveal"
      }
    };
  }

  function normalizeScriptRecord(item) {
    var clean = item || {};
    return {
      id: clean.id || uid("script"),
      title: String(clean.title || "Untitled Script").trim(),
      contentId: clean.contentId || "",
      sections: Object.assign({ hook: "", intro: "", story: "", value: "", proof: "", cta: "" }, clean.sections || {})
    };
  }

  function normalizeVaultRecord(item) {
    var clean = item || {};
    return {
      id: clean.id || uid("vault"),
      title: String(clean.title || "New Asset").trim(),
      category: String(clean.category || "Hook"),
      tags: Array.isArray(clean.tags) ? clean.tags : splitTags(clean.tags || ""),
      content: String(clean.content || "").trim(),
      favorite: Boolean(clean.favorite)
    };
  }

  function ensureSelections() {
    if (!ui.selectedContentId || !findById(state.content, ui.selectedContentId)) ui.selectedContentId = state.content.length ? state.content[0].id : "";
    if (!ui.selectedScriptId || !findById(state.scripts, ui.selectedScriptId)) ui.selectedScriptId = state.scripts.length ? state.scripts[0].id : "";
    if (!ui.selectedCampaignId || !findById(state.campaigns, ui.selectedCampaignId)) ui.selectedCampaignId = state.campaigns.length ? state.campaigns[0].id : "";
    if (!ui.selectedSponsorId || !findById(state.sponsors, ui.selectedSponsorId)) ui.selectedSponsorId = state.sponsors.length ? state.sponsors[0].id : "";
  }

  function getSelectedContent() { return findById(state.content, ui.selectedContentId) || state.content[0] || null; }
  function getSelectedScript() { return findById(state.scripts, ui.selectedScriptId) || state.scripts[0] || null; }
  function getSelectedCampaign() { return findById(state.campaigns, ui.selectedCampaignId) || state.campaigns[0] || null; }
  function getSelectedSponsor() { return findById(state.sponsors, ui.selectedSponsorId) || state.sponsors[0] || null; }
  function getContentById(id) { return findById(state.content, id); }

  function getFilteredContent() {
    return state.content.filter(function (item) {
      var haystack = [item.title, item.description, item.platform, item.stage, item.hook, item.cta, item.topic].join(" ").toLowerCase();
      var searchMatch = !ui.search || haystack.indexOf(ui.search) > -1;
      var assigneeMatch = ui.assigneeFilter === "all" || item.assigneeId === ui.assigneeFilter;
      var viewMatch = matchesView(item);
      return searchMatch && assigneeMatch && viewMatch;
    });
  }

  function getFilteredHooks() {
    return state.hooks.filter(function (item) {
      return !ui.search || [item.text, item.category, item.platform].join(" ").toLowerCase().indexOf(ui.search) > -1;
    });
  }

  function getFilteredCampaigns() {
    return state.campaigns.filter(function (item) {
      return !ui.search || [item.name, item.offer, item.waveLabel].join(" ").toLowerCase().indexOf(ui.search) > -1;
    });
  }

  function getFilteredSponsors() {
    return state.sponsors.filter(function (item) {
      return !ui.search || [item.name, item.approval, item.paymentStatus, item.notes].join(" ").toLowerCase().indexOf(ui.search) > -1;
    });
  }

  function getFilteredNotes() {
    return state.notes.filter(function (item) {
      return !ui.search || [item.title, item.body, item.type].join(" ").toLowerCase().indexOf(ui.search) > -1;
    });
  }

  function getFilteredVaultItems() {
    return state.vault.filter(function (item) {
      return !ui.search || [item.title, item.category, item.content, item.tags.join(" ")].join(" ").toLowerCase().indexOf(ui.search) > -1;
    });
  }

  function matchesView(item) {
    if (ui.viewFilter === "all") return true;
    if (ui.viewFilter === "critical") return item.priority === "Critical" || isOverdue(item.deadline);
    if (ui.viewFilter === "pipeline") return STAGES.indexOf(item.stage) < STAGES.length - 1;
    if (ui.viewFilter === "calendar") return item.stage === "Scheduled" || item.stage === "Published";
    if (ui.viewFilter === "team") return Boolean(item.assigneeId);
    return true;
  }

  function computeDashboardMetrics() {
    var content = state.content;
    if (!content.length) {
      return {
        healthScore: 0,
        healthSummary: "No content tracked yet",
        operationalPulseLabel: "Awaiting signal",
        operationalPulseDetail: "Create the first content record to activate Operational Pulse™ and start measuring workflow pressure, readiness, and publishing stability.",
        operationalPulseTone: "is-info",
        consistencyScore: 0,
        consistencyLabel: "Not started",
        consistencySummary: "Add content to begin measuring cadence",
        overdueCount: 0,
        sponsorRiskCount: 0,
        sponsorRiskLabel: "Stable",
        campaignMomentum: clampNumber(average(state.campaigns.map(function (item) { return item.progress; })), 0, 100),
        campaignMomentumLabel: state.campaigns.length ? "Campaigns active without content load" : "No campaigns active",
        launchConfidence: 0,
        launchSignal: "Launch signal unavailable",
        productionMomentum: 0,
        productionMomentumLabel: "Add content to begin measuring workflow speed",
        momentumSignal: "Momentum not active",
        platformBalance: 0,
        platformBalanceLabel: "No distribution data",
        platformDistribution: {},
        distributionSignal: "Distribution signal unavailable",
        reviewStuck: 0,
        reviewSignal: "Review queue idle",
        blockedCount: 0,
        dependencyRiskCount: 0,
        urgentDeadlineCount: 0,
        burnoutRisk: 0,
        burnoutRiskLabel: "Low",
        publishingStreak: 0,
        weeklyCompletionRate: 0,
        dominantPlatform: "",
        dominantPlatformShare: 0,
        activeWaveName: state.campaigns[0] ? state.campaigns[0].name : "No active wave",
        activeWaveDeadline: state.campaigns[0] ? state.campaigns[0].deadline : ""
      };
    }
    var readinessAverage = average(content.map(function (item) { return computeReadiness(item).score; }));
    var viralAverage = average(content.map(function (item) { return computeViralScore(item).total; }));
    var overdue = content.filter(function (item) { return isOverdue(item.deadline) && item.stage !== "Published"; }).length;
    var published = content.filter(function (item) { return item.stage === "Published"; }).length;
    var scheduled = content.filter(function (item) { return item.stage === "Scheduled"; }).length;
    var reviewStuck = content.filter(function (item) { return item.stage === "Review" || item.stage === "Sponsor Approval"; }).length;
    var blockedCount = content.filter(function (item) { return Boolean(item.blocker); }).length;
    var lowReadinessCount = content.filter(function (item) { return computeReadiness(item).score < 70; }).length;
    var weakHookCount = content.filter(function (item) { return analyzeHookDraft(item.hook).total < 68; }).length;
    var weakThumbnailCount = content.filter(function (item) { return analyzeThumbnailPlan(item).score < 70; }).length;
    var missingCtaCount = content.filter(function (item) { return !item.cta || item.cta.length < 12; }).length;
    var dependencyRiskCount = content.filter(function (item) { return item.dependencies && item.dependencies.length >= 2 && item.stage !== "Published"; }).length;
    var urgentDeadlineCount = content.filter(function (item) { return dateDiffDays(item.deadline) <= 2 && item.stage !== "Published"; }).length;
    var consistencyScore = clampNumber((published * 12) + (scheduled * 7), 0, 100);
    var platformDistribution = {};
    content.forEach(function (item) { platformDistribution[item.platform] = (platformDistribution[item.platform] || 0) + 1; });
    var platformCounts = Object.keys(platformDistribution).map(function (key) { return platformDistribution[key]; });
    var concentration = platformCounts.length ? Math.max.apply(null, platformCounts) / content.length : 0;
    var platformBalance = clampNumber(100 - Math.round(concentration * 42), 35, 96);
    var dominantPlatform = getDominantPlatform(platformDistribution);
    var dominantPlatformShare = dominantPlatform ? Math.round((platformDistribution[dominantPlatform] / content.length) * 100) : 0;
    var sponsorRiskCount = state.sponsors.filter(function (item) { return item.approval !== "Approved" && dateDiffDays(item.deadline) <= 4; }).length;
    var campaignMomentum = clampNumber(
      average(state.campaigns.map(function (item) { return item.progress; })) -
      (sponsorRiskCount * 4) -
      (reviewStuck * 3) -
      Math.max(0, lowReadinessCountForCampaigns() * 2),
      0,
      100
    );
    var publishingStreak = computePublishingStreak();
    var weeklyCompletionRate = clampNumber(((published + scheduled) / Math.max(1, content.length)) * 100, 0, 100);
    var productionMomentum = clampNumber(average(content.map(function (item) { return ((STAGES.indexOf(item.stage) + 1) / STAGES.length) * 100; })) - (overdue * 7) - (blockedCount * 4) + (scheduled * 4), 12, 100);
    var activeWave = getActiveCampaignSummary();
    var burnoutRisk = clampNumber((overdue * 13) + (reviewStuck * 9) + (blockedCount * 10) + (urgentDeadlineCount * 12), 0, 100);
    var launchConfidence = clampNumber(
      average([
        campaignMomentum,
        readinessAverage,
        viralAverage,
        100 - (sponsorRiskCount * 14),
        100 - (reviewStuck * 9),
        100 - (lowReadinessCount * 4),
        100 - (weakThumbnailCount * 5),
        100 - (missingCtaCount * 4)
      ]),
      18,
      98
    );
    var healthScore = clampNumber((readinessAverage * 0.34) + (viralAverage * 0.26) + (consistencyScore * 0.18) + (platformBalance * 0.1) + ((100 - overdue * 8) * 0.12), 22, 98);
    var pulse = computeOperationalPulseState({
      healthScore: healthScore,
      launchConfidence: launchConfidence,
      productionMomentum: productionMomentum,
      campaignMomentum: campaignMomentum,
      sponsorRiskCount: sponsorRiskCount,
      reviewStuck: reviewStuck,
      overdueCount: overdue,
      blockedCount: blockedCount,
      burnoutRisk: burnoutRisk,
      platformBalance: platformBalance
    });
    return {
      healthScore: healthScore,
      healthSummary: healthScore >= 80 ? "Operating strong" : healthScore >= 65 ? "Good with pressure points" : "Needs intervention",
      operationalPulseLabel: pulse.label,
      operationalPulseDetail: pulse.detail,
      operationalPulseTone: pulse.tone,
      consistencyScore: consistencyScore,
      consistencyLabel: consistencyScore >= 80 ? "Reliable" : consistencyScore >= 55 ? "Uneven" : "Fragile",
      consistencySummary: published + " published, " + scheduled + " scheduled",
      overdueCount: overdue,
      sponsorRiskCount: sponsorRiskCount,
      sponsorRiskLabel: sponsorRiskCount === 0 ? "Stable" : sponsorRiskCount + " at-risk deals",
      campaignMomentum: campaignMomentum,
      campaignMomentumLabel: campaignMomentum >= 75 ? "Healthy launch velocity" : campaignMomentum >= 55 ? "Moderate pace" : "Low readiness momentum",
      launchConfidence: launchConfidence,
      launchSignal: launchConfidence >= 78 ? "Launch confidence holding" : launchConfidence >= 60 ? "Launch confidence fluctuating" : "Launch confidence deteriorating",
      productionMomentum: productionMomentum,
      productionMomentumLabel: productionMomentum >= 76 ? "Production is moving with confidence." : productionMomentum >= 58 ? "Production is moving, but pressure is building." : "Production drag is slowing weekly output.",
      momentumSignal: productionMomentum >= 76 ? "Momentum stable" : productionMomentum >= 58 ? "Momentum softening" : "Momentum slowing",
      platformBalance: platformBalance,
      platformBalanceLabel: platformBalance >= 75 ? "Balanced mix" : platformBalance >= 60 ? "Slightly concentrated" : "Over-weighted on one channel",
      platformDistribution: platformDistribution,
      distributionSignal: dominantPlatformShare >= 45 ? "Distribution dependency rising" : dominantPlatformShare >= 32 ? "Distribution mix controlled" : "Distribution expanding",
      reviewStuck: reviewStuck,
      reviewSignal: reviewStuck >= 4 ? "Review queue unstable" : reviewStuck >= 2 ? "Review queue tightening" : "Review queue controlled",
      blockedCount: blockedCount,
      dependencyRiskCount: dependencyRiskCount,
      urgentDeadlineCount: urgentDeadlineCount,
      burnoutRisk: burnoutRisk,
      burnoutRiskLabel: burnoutRisk >= 70 ? "Elevated" : burnoutRisk >= 42 ? "Watch" : "Low",
      publishingStreak: publishingStreak,
      weeklyCompletionRate: weeklyCompletionRate,
      dominantPlatform: dominantPlatform,
      dominantPlatformShare: dominantPlatformShare,
      activeWaveName: activeWave.name,
      activeWaveDeadline: activeWave.deadline
    };
  }

  function computeReadiness(item) {
    var score = 0;
    var notes = [];
    var script = state.scripts.filter(function (entry) { return entry.contentId === item.id; })[0];
    if (script && analyzeScript(script).checkpoints >= 5) score += 20; else notes.push("Script structure is incomplete.");
    var hookScore = analyzeHookDraft(item.hook).total;
    if (hookScore >= 75) score += 15; else notes.push("Hook quality needs work.");
    var thumbnailScore = analyzeThumbnailPlan(item).score;
    if (item.thumbnailPlan && item.thumbnailPlan.focus && item.thumbnailPlan.direction && thumbnailScore >= 72) score += 12; else notes.push(item.thumbnailPlan ? "Thumbnail clarity is soft." : "Thumbnail strategy is incomplete.");
    if (item.cta && item.cta.length > 10) score += 12; else notes.push("CTA is missing or weak.");
    if (item.platform) score += 8; else notes.push("Platform is not selected.");
    if (item.campaignId) score += 10; else notes.push("Campaign is not assigned.");
    if (!isOverdue(item.deadline)) score += 8; else notes.push("Deadline is overdue.");
    if (item.stage === "Scheduled" || item.stage === "Published") score += 15;
    else if (item.stage === "Review" || item.stage === "Sponsor Approval") score += 10;
    var sponsor = item.sponsorId ? findById(state.sponsors, item.sponsorId) : null;
    if (!sponsor || sponsor.approval === "Approved") score += 10; else { score -= 6; notes.push("Sponsor approval is still pending."); }
    if (item.campaignId && sponsor && sponsor.approval !== "Approved") notes.unshift("Campaign timing is exposed by sponsor risk.");
    score = clampNumber(score, 10, 100);
    var label = score >= 85 ? "Ready to Publish" : score >= 70 ? "Almost Ready" : score >= 50 ? "Needs Work" : "Not Ready";
    var tone = score >= 85 ? "is-success" : score >= 70 ? "is-info" : score >= 50 ? "is-warning" : "is-danger";
    return { score: score, label: label, tone: tone, summary: notes[0] || "This item is operationally ready for the next production step." };
  }

  function computeOperationalPulseState(input) {
    if (input.launchConfidence < 58 || input.sponsorRiskCount >= 2 || input.overdueCount >= 3) {
      return {
        label: "Pressure escalating",
        detail: "Operational Pulse™ is detecting launch instability driven by overdue work, sponsor exposure, or weak release confidence.",
        tone: "is-danger"
      };
    }
    if (input.productionMomentum < 58 || input.reviewStuck >= 3 || input.blockedCount >= 2 || input.burnoutRisk >= 55) {
      return {
        label: "System under load",
        detail: "Operational Pulse™ is detecting review drag, blocker pressure, or execution fatigue across the active production flow.",
        tone: "is-warning"
      };
    }
    if (input.healthScore >= 80 && input.launchConfidence >= 76 && input.platformBalance >= 68) {
      return {
        label: "Control holding",
        detail: "Operational Pulse™ is showing stable cadence, balanced channel load, and strong launch readiness across the workspace.",
        tone: "is-success"
      };
    }
    return {
      label: "System watch",
      detail: "Operational Pulse™ is monitoring momentum, dependencies, and channel concentration for early signs of delivery drift.",
      tone: "is-info"
    };
  }

  function lowReadinessCountForCampaigns() {
    return state.content.filter(function (item) {
      return item.campaignId && computeReadiness(item).score < 70;
    }).length;
  }

  function computePublishingStreak() {
    var streak = 0;
    for (var index = 0; index < 10; index += 1) {
      var date = todayOffset(index * -1);
      var hasPublish = state.content.some(function (item) {
        return item.stage === "Published" && item.deadline === date;
      });
      if (!hasPublish) break;
      streak += 1;
    }
    return streak;
  }

  function getActiveCampaignSummary() {
    var active = state.campaigns.slice().sort(function (a, b) {
      return dateDiffDays(a.deadline) - dateDiffDays(b.deadline);
    })[0];
    return {
      name: active ? active.waveLabel + " • " + active.name : "No active wave",
      deadline: active ? active.deadline : ""
    };
  }

  function getDominantPlatform(map) {
    var keys = Object.keys(map || {});
    if (!keys.length) return "";
    return keys.sort(function (a, b) { return map[b] - map[a]; })[0];
  }

  function computeInsights() {
    var insights = [];
    var metrics = computeDashboardMetrics();
    state.content.forEach(function (item) {
      var hookScore = analyzeHookDraft(item.hook).total;
      var readiness = computeReadiness(item);
      var viral = computeViralScore(item);
      var thumbnail = analyzeThumbnailPlan(item);
      if (hookScore < 68) {
        insights.push(makeInsight("insight-hook-" + item.id, "Hook is underperforming", "High", "The current opener lacks enough tension or curiosity for " + item.title + ".", "Strengthen the opening contrast or generate three new angles.", "open-content", item.id, { trend: "Opening drag", marker: "Hook risk" }));
      }
      if (!item.cta || item.cta.length < 12) {
        insights.push(makeInsight("insight-cta-" + item.id, "CTA is missing", "Medium", item.title + " does not have a strong next-step CTA.", "Add a platform-specific action that converts attention into a result.", "open-content", item.id, { trend: "Conversion softness", marker: "CTA risk" }));
      }
      if (isOverdue(item.deadline) && item.stage !== "Published") {
        insights.push(makeInsight("insight-overdue-" + item.id, "Production item is overdue", "High", item.title + " is still in " + item.stage + " after its deadline.", "Reprioritize or move the deadline after confirming the blocker.", "open-content", item.id, { trend: "Deadline slip", marker: "Schedule risk" }));
      }
      if (viral.total < 70) {
        insights.push(makeInsight("insight-viral-" + item.id, "Opportunity score is low", "Medium", item.title + " is below the target opportunity threshold.", "Use the Viral Opportunity Engine to improve title, hook, CTA, or thumbnail clarity.", "route-viral", item.id, { trend: "Packaging drag", marker: "Opportunity risk" }));
      }
      if (readiness.score < 60) {
        insights.push(makeInsight("insight-ready-" + item.id, "Content readiness is low", "Medium", item.title + " is not ready for scheduling.", "Complete script, CTA, thumbnail plan, or campaign assignment before moving forward.", "open-content", item.id, { trend: "Readiness drag", marker: "Readiness risk" }));
      }
      if (thumbnail.score < 70) {
        insights.push(makeInsight("insight-thumbnail-" + item.id, "Thumbnail confidence is weak", "Medium", item.title + " is carrying a thumbnail plan that may not convert attention cleanly.", "Simplify the focal story and remove the main visual distraction before scheduling.", "open-content", item.id, { trend: "Packaging drag", marker: "Thumbnail risk" }));
      }
      if (item.blocker) {
        insights.push(makeInsight("insight-blocker-" + item.id, "Workflow blocker is active", dateDiffDays(item.deadline) <= 2 ? "High" : "Medium", item.title + " is carrying an active blocker: " + item.blocker, "Review the blocker, confirm the dependency owner, and decide whether this item should move or be rescheduled.", "open-content", item.id, { trend: "Flow interruption", marker: "Workflow risk" }));
      }
    });
    state.sponsors.forEach(function (item) {
      if (item.approval !== "Approved" && dateDiffDays(item.deadline) <= 4) {
        insights.push(makeInsight("insight-sponsor-" + item.id, "Sponsor deliverable risk", "High", item.name + " still needs approval with a close deadline.", "Move the sponsor record forward or realign the delivery promise today.", "open-sponsor", item.id, { trend: "Commercial exposure", marker: "Sponsor risk" }));
      }
    });
    var reviewStuck = state.content.filter(function (item) { return item.stage === "Review" || item.stage === "Sponsor Approval"; });
    if (reviewStuck.length >= 3) {
      insights.push(makeInsight("insight-review-queue", "Too many items are stuck in review", "High", reviewStuck.length + " items are sitting in review-related stages.", "Clear one approval lane before adding new content to the queue.", "route-pipeline", "", { trend: "Review congestion", marker: "Queue risk" }));
    }
    if (metrics.platformBalance < 62) {
      insights.push(makeInsight("insight-platform-balance", "Platform mix is unbalanced", "Medium", "Too much of the workload is concentrated on one platform.", "Shift one upcoming asset into a weaker channel to improve distribution resilience.", "route-calendar", "", { trend: "Distribution concentration", marker: "Platform risk" }));
    }
    if (countPublishingGaps() >= 4) {
      insights.push(makeInsight("insight-gap", "Publishing gaps detected", "Medium", "The next 14 days include multiple empty publishing days.", "Pull one high-readiness item into Scheduled to protect consistency.", "route-calendar", "", { trend: "Cadence risk", marker: "Publishing gap" }));
    }
    if (metrics.weeklyCompletionRate < 55) {
      insights.push(makeInsight("insight-slowdown", "Publishing slowdown is forming", "Medium", "Weekly completion is below the target operational threshold and consistency may slip.", "Move one almost-ready asset into a scheduled slot and clear the next blocker in line.", "route-pipeline", "", { trend: "Output slowdown", marker: "Momentum risk" }));
    }
    if (metrics.launchConfidence < 60) {
      insights.push(makeInsight("insight-launch-confidence", "Launch confidence is deteriorating", "High", "Current campaign readiness, sponsor pressure, and delivery drag are weakening launch confidence.", "Stabilize the active wave before adding new work into the release queue.", "route-pipeline", "", { trend: "Launch instability", marker: "Launch risk", primaryLabel: "Open affected workflow" }));
    }
    if (metrics.burnoutRisk >= 55) {
      insights.push(makeInsight("insight-burnout", "Burnout risk is rising", metrics.burnoutRisk >= 72 ? "High" : "Medium", "Overdue work, review drag, and urgent deadlines are increasing execution fatigue.", "Reduce one pressure point now by rescheduling a weak asset or clearing a stuck approval.", "route-calendar", "", { trend: "Workload strain", marker: "Burnout risk", primaryLabel: "Reschedule dependency" }));
    }
    getRepeatedTopics().forEach(function (topic) {
      insights.push(makeInsight("insight-topic-" + topic, "Repeated content topic", "Low", "The topic \"" + topic + "\" appears repeatedly in the active queue.", "Vary the angle, audience, or promise to avoid creative overlap.", "route-pipeline", ""));
    });
    state.campaigns.forEach(function (item) {
      if (item.progress < 55 && dateDiffDays(item.deadline) <= 6) {
        insights.push(makeInsight("insight-campaign-" + item.id, "Campaign readiness is low", "High", item.name + " is behind pace for its current deadline.", "Tighten the sequence, remove one weak asset, and push the hero piece first.", "open-campaign", item.id, { trend: "Wave delay", marker: "Campaign risk" }));
      }
    });
    return insights.sort(compareInsightSeverity);
  }

  function makeInsight(id, title, severity, reason, action, cta, relatedId, options) {
    var tone = severity === "High" ? "is-danger" : severity === "Medium" ? "is-warning" : "is-info";
    var meta = buildInsightMeta(title, severity, cta, relatedId, options || {});
    return {
      id: id,
      title: title,
      severity: severity,
      reason: reason,
      action: action,
      tone: tone,
      cta: cta,
      relatedId: relatedId,
      marker: meta.marker,
      trend: meta.trend,
      timeline: meta.timeline,
      pressure: meta.pressure,
      primaryLabel: meta.primaryLabel,
      secondaryCta: meta.secondaryCta,
      secondaryLabel: meta.secondaryLabel,
      shortReason: summarizeInsightReason(title, reason),
      shortAction: summarizeInsightAction(title, action)
    };
  }

  function summarizeInsightReason(title, reason) {
    var lower = String(title || "").toLowerCase();
    if (lower.indexOf("hook") > -1) return "Weak opening tension detected.";
    if (lower.indexOf("cta") > -1) return "CTA strength is below target.";
    if (lower.indexOf("overdue") > -1) return "Deadline has slipped past its delivery window.";
    if (lower.indexOf("opportunity") > -1) return "Packaging score is under the release threshold.";
    if (lower.indexOf("readiness") > -1) return "Readiness is below scheduling level.";
    if (lower.indexOf("blocker") > -1) return "Active blocker is stopping forward movement.";
    if (lower.indexOf("sponsor") > -1) return "Sponsor approval pressure threatens delivery.";
    if (lower.indexOf("review") > -1) return "Review queue is slowing release throughput.";
    if (lower.indexOf("platform") > -1) return "Distribution is over-weighted on one channel.";
    if (lower.indexOf("gap") > -1) return "Upcoming schedule gaps need coverage.";
    if (lower.indexOf("slowdown") > -1) return "Weekly completion is slipping.";
    if (lower.indexOf("topic") > -1) return "Topic overlap is rising in the active queue.";
    if (lower.indexOf("campaign") > -1) return "Launch wave is behind pace.";
    return reason;
  }

  function summarizeInsightAction(title, action) {
    var lower = String(title || "").toLowerCase();
    if (lower.indexOf("hook") > -1) return "Rebuild the opening angle.";
    if (lower.indexOf("cta") > -1) return "Replace the CTA with one concrete ask.";
    if (lower.indexOf("overdue") > -1) return "Re-sequence or reschedule this item.";
    if (lower.indexOf("opportunity") > -1) return "Rework hook, title, CTA, or packaging.";
    if (lower.indexOf("readiness") > -1) return "Complete the missing production inputs.";
    if (lower.indexOf("blocker") > -1) return "Assign the dependency owner now.";
    if (lower.indexOf("sponsor") > -1) return "Clear approval or renegotiate the deadline.";
    if (lower.indexOf("review") > -1) return "Clear one approval lane before adding more work.";
    if (lower.indexOf("platform") > -1) return "Shift one upcoming asset into a weaker channel.";
    if (lower.indexOf("gap") > -1) return "Move one ready asset into the schedule.";
    if (lower.indexOf("slowdown") > -1) return "Unlock the next near-ready asset.";
    if (lower.indexOf("topic") > -1) return "Change the angle, audience, or promise.";
    if (lower.indexOf("campaign") > -1) return "Tighten the wave and push the hero asset first.";
    return action;
  }

  function compareInsightSeverity(a, b) {
    var weight = { High: 3, Medium: 2, Low: 1 };
    return weight[b.severity] - weight[a.severity];
  }

  function applyInsightAction(id, action) {
    var insight = computeInsights().filter(function (item) { return item.id === id; })[0];
    if (!insight) return;
    if (action === "open-content") openContentModal(insight.relatedId);
    else if (action === "open-sponsor") openSponsorModal(insight.relatedId);
    else if (action === "open-campaign") openCampaignModal(insight.relatedId);
    else if (action === "route-calendar") window.location.hash = "calendar";
    else if (action === "route-pipeline") window.location.hash = "pipeline";
    else if (action === "route-hooks") { ui.selectedContentId = insight.relatedId || ui.selectedContentId; window.location.hash = "hooks"; }
    else if (action === "route-viral") { ui.selectedContentId = insight.relatedId || ui.selectedContentId; window.location.hash = "viral"; }
  }

  function computeStagePressure() {
    var counts = {};
    STAGES.forEach(function (stage) { counts[stage] = 0; });
    state.content.forEach(function (item) { counts[item.stage] += 1; });
    return STAGES.map(function (stage) { return { stage: stage, count: counts[stage] }; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 5);
  }

  function computeViralScore(item) {
    var hookAnalysis = analyzeHookDraft(item.hook);
    var titleScore = analyzeTitle(item.title);
    var ctaScore = analyzeCta(item.cta);
    var retentionScore = analyzeRetention(item.description, item.platform);
    var fitScore = platformMatchScore(item.platform, item.stage);
    var thumb = analyzeThumbnailPlan(item).score;
    var breakdown = [
      { label: "Hook Score", score: hookAnalysis.total, explain: "Measures tension, clarity, authority, and emotional pull." },
      { label: "Title Score", score: titleScore, explain: "Checks specificity, promise strength, and curiosity without excess." },
      { label: "CTA Score", score: ctaScore, explain: "Scores next-step clarity and outcome specificity." },
      { label: "Retention Score", score: retentionScore, explain: "Looks for payoff timing and educational structure indicators." },
      { label: "Platform Fit", score: fitScore, explain: "Aligns promise and content type with audience expectations." },
      { label: "Thumbnail Clarity", score: thumb, explain: "Checks emotional direction, focus, and clutter risk." }
    ];
    var total = Math.round(average(breakdown.map(function (entry) { return entry.score; })));
    if (!item.cta || item.cta.length < 12) total -= 6;
    if (hookAnalysis.total < 68) total -= 4;
    total = clampNumber(total, 24, 98);
    var recommendations = [];
    if (hookAnalysis.total < 72) recommendations.push("Sharpen the opening hook by adding a consequence, contradiction, or stronger viewer payoff.");
    if (titleScore < 72) recommendations.push("Tighten the title promise. Reduce vagueness and make the core tension more explicit.");
    if (ctaScore < 68) recommendations.push("Use a more concrete CTA tied to one specific action or result.");
    if (retentionScore < 70) recommendations.push("Front-load the payoff and show the framework or mistake earlier in the structure.");
    if (fitScore < 70) recommendations.push("Reframe the idea for the chosen channel instead of copying the same promise everywhere.");
    if (thumb < 72) recommendations.push("Simplify the thumbnail concept and commit to one dominant focal story.");
    if (!recommendations.length) recommendations.push("This concept is strong enough to move into schedule preparation with minor refinement only.");
    return {
      total: total,
      breakdown: breakdown,
      recommendations: recommendations,
      afterExample: buildImprovedHookExample(item)
    };
  }

  function analyzeHookDraft(text) {
    text = String(text || "").trim();
    var words = text.split(/\s+/).filter(Boolean);
    var curiosity = containsAny(text, ["why", "how", "nobody", "secret", "mistake", "truth", "before", "after"]) ? 88 : clampNumber(42 + words.length * 3, 35, 70);
    var authority = containsAny(text, ["tested", "proven", "spent", "built", "scaled", "clients", "revenue", "system"]) ? 84 : 58;
    var urgency = containsAny(text, ["today", "now", "before", "stop", "risk", "too late"]) ? 82 : 54;
    var clarity = text.length >= 18 && text.length <= 150 ? 78 : 58;
    var emotion = containsAny(text, ["stuck", "wasting", "embarrassing", "painful", "obsessed", "fear", "late", "chaos"]) ? 84 : 57;
    var total = Math.round(average([curiosity, authority, urgency, clarity, emotion]));
    var notes = [];
    if (words.length < 5) notes.push("The hook is too short to establish a credible open loop.");
    if (!containsAny(text, ["you", "your"])) notes.push("Consider speaking directly to the viewer for a stronger pull.");
    if (!containsAny(text, ["?", "why", "how", "before", "after", "secret", "mistake"])) notes.push("Increase curiosity or contrast to improve stop power.");
    if (!notes.length) notes.push("The hook shows solid tension, clarity, and audience pull.");
    return {
      total: total,
      metrics: [
        { label: "Curiosity", score: curiosity },
        { label: "Authority", score: authority },
        { label: "Urgency", score: urgency },
        { label: "Clarity", score: clarity },
        { label: "Emotion", score: emotion }
      ],
      summary: total >= 80 ? "High-potential opening with strong stop power." : total >= 65 ? "Solid base, but it still needs sharper tension." : "The concept exists, but the hook needs more strategic pressure.",
      notes: notes
    };
  }

  function analyzeTitle(title) {
    var clean = String(title || "").trim();
    var words = clean.split(/\s+/).filter(Boolean);
    var specificity = clean.length >= 28 && clean.length <= 72 ? 80 : 60;
    var tension = containsAny(clean, ["why", "how", "mistake", "truth", "hidden", "cost", "secret", "saved", "killed"]) ? 84 : 62;
    var clarity = words.length >= 5 && words.length <= 12 ? 78 : 64;
    return clampNumber(average([specificity, tension, clarity]), 42, 95);
  }

  function analyzeCta(cta) {
    var clean = String(cta || "").trim();
    if (!clean) return 28;
    var specificity = containsAny(clean, ["download", "save", "comment", "reply", "watch", "grab", "share", "audit"]) ? 82 : 58;
    var clarity = clean.length >= 12 ? 76 : 52;
    var outcome = containsAny(clean, ["checklist", "framework", "newsletter", "template", "system", "guide"]) ? 80 : 60;
    return clampNumber(average([specificity, clarity, outcome]), 30, 94);
  }

  function analyzeRetention(description, platform) {
    var clean = String(description || "").toLowerCase();
    var structure = containsAny(clean, ["breakdown", "framework", "checklist", "mistakes", "teardown", "walkthrough"]) ? 80 : 62;
    var payoff = containsAny(clean, ["saved", "fixed", "recovered", "improve", "scale", "stop"]) ? 78 : 60;
    var pace = platform === "Shorts" || platform === "TikTok" || platform === "Instagram Reel" ? 76 : 72;
    return clampNumber(average([structure, payoff, pace]), 40, 92);
  }

  function analyzeScript(script) {
    var all = Object.keys(script.sections).map(function (key) { return script.sections[key]; }).join(" ");
    var words = all.split(/\s+/).filter(Boolean).length;
    var fillerTerms = ["just", "really", "actually", "basically", "kind of", "sort of", "maybe", "literally"];
    var fillerWarnings = fillerTerms.filter(function (term) { return all.toLowerCase().indexOf(term) > -1; });
    var checkpoints = Object.keys(script.sections).filter(function (key) { return script.sections[key] && script.sections[key].length > 30; }).length;
    var pacing = words < 180 ? "Fast" : words < 340 ? "Balanced" : "Dense";
    var retention = clampNumber(82 - fillerWarnings.length * 8 - (pacing === "Dense" ? 10 : 0) + checkpoints * 2, 42, 95);
    var notes = [];
    if (script.sections.hook.length < 50) notes.push("Hook section is light. Add a stronger first-15-second payoff promise.");
    if (script.sections.proof.length < 45) notes.push("Proof is thin. Add evidence, specifics, or case detail.");
    if (script.sections.cta.length < 18) notes.push("CTA section is weak. Clarify the next action.");
    if (fillerWarnings.length) notes.push("Filler terms detected: " + fillerWarnings.join(", ") + ".");
    if (!notes.length) notes.push("Script structure is balanced with a strong chance of holding attention.");
    return { words: words, pacing: pacing, fillerWarnings: fillerWarnings, checkpoints: checkpoints, retention: retention, notes: notes };
  }

  function analyzeThumbnailPlan(item) {
    var plan = item.thumbnailPlan || {};
    var score = 72;
    if (plan.direction === "Shock" || plan.direction === "Urgent") score += 8;
    if (plan.textPlacement === "Minimal text") score += 7;
    if (plan.clutter === "Busy") score -= 14;
    if (plan.focus === "Face reaction" || plan.focus === "Result reveal") score += 6;
    score = clampNumber(score, 40, 96);
    var notes = [];
    if (plan.clutter === "Busy") notes.push("The current plan risks visual overload. Reduce competing elements.");
    if (plan.textPlacement === "Top banner") notes.push("Top-heavy text can compete with the focal subject on smaller screens.");
    if (plan.direction === "Authority" && item.platform !== "LinkedIn Post" && item.platform !== "YouTube") notes.push("Authority-led framing may feel too formal for this platform.");
    if (!notes.length) notes.push("The strategy has clear hierarchy and a viable curiosity frame.");
    return {
      score: score,
      indicators: [
        { label: "Curiosity score", value: score + "/100" },
        { label: "Focus style", value: plan.focus || "Result reveal" },
        { label: "Balance indicator", value: plan.clutter === "Busy" ? "Risky" : "Controlled" },
        { label: "Attention warning", value: notes[0] || "No critical warning" }
      ],
      notes: notes
    };
  }

  function buildRepurposePlan(item) {
    return Object.keys(PLATFORM_GUIDES).map(function (platform) {
      var guide = PLATFORM_GUIDES[platform];
      var score = clampNumber(computeViralScore(item).total - (platform === item.platform ? 0 : 6) + ((platform === "Shorts" || platform === "TikTok") ? 2 : 0), 58, 95);
      return {
        platform: platform,
        score: score,
        duration: guide.duration,
        cta: guide.cta,
        risk: guide.risk,
        angle: buildAngleForPlatform(item, platform)
      };
    });
  }

  function buildAngleForPlatform(item, platform) {
    var base = item.hook || item.title;
    if (platform === "Carousel") return "Break the core idea into a swipeable framework with one clear lesson per slide: " + base;
    if (platform === "Email Teaser") return "Turn the idea into an open-loop teaser that makes the full asset feel necessary.";
    if (platform === "LinkedIn Post") return "Shift from creator language to operator language and stress the business implication.";
    if (platform === "Shorts" || platform === "TikTok" || platform === "Instagram Reel") return "Lead with the outcome first, then compress context into a fast payoff loop.";
    return "Keep the core promise, reinforce proof, and open with the strongest tension line from the source concept.";
  }

  function buildCalendar() {
    var today = new Date();
    var start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Array.from({ length: 14 }).map(function (_, index) {
      var current = new Date(start);
      current.setDate(start.getDate() + index);
      var label = current.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      var events = state.content.filter(function (item) { return item.deadline === isoDate(current); }).map(function (item) {
        return item.platform + ": " + item.title;
      });
      return { label: label, events: events, gap: events.length === 0, burnout: events.length >= 3 };
    });
  }

  function countPublishingGaps() {
    return buildCalendar().filter(function (day) { return day.gap; }).length;
  }

  function getRepeatedTopics() {
    var topics = {};
    state.content.forEach(function (item) {
      if (!item.topic) return;
      topics[item.topic.toLowerCase()] = (topics[item.topic.toLowerCase()] || 0) + 1;
    });
    return Object.keys(topics).filter(function (key) { return topics[key] >= 2; }).slice(0, 3);
  }

  function getAlerts(includeArchiveAware) {
    var items = [];
    computeInsights().forEach(function (insight) {
      items.push({ id: insight.id, title: insight.title, label: insight.severity, tone: insight.tone, detail: insight.reason, action: insight.cta, relatedId: insight.relatedId });
    });
    if (includeArchiveAware) items = items.filter(function (item) { return state.archivedAlerts.indexOf(item.id) === -1; });
    return items.slice(0, 10);
  }

  function buildInsightMeta(title, severity, cta, relatedId, options) {
    var meta = {
      marker: severity === "High" ? "Escalated" : severity === "Medium" ? "Attention" : "Advisory",
      trend: severity === "High" ? "Escalating" : severity === "Medium" ? "Building pressure" : "Monitor",
      timeline: "Review this workflow this week",
      pressure: "Operational follow-through recommended",
      primaryLabel: "Open affected workflow",
      secondaryCta: "",
      secondaryLabel: ""
    };
    var content = findById(state.content, relatedId);
    var sponsor = findById(state.sponsors, relatedId);
    var campaign = findById(state.campaigns, relatedId);
    var lowerTitle = String(title || "").toLowerCase();

    if (content) {
      var days = dateDiffDays(content.deadline);
      meta.timeline = days < 0 ? Math.abs(days) + " days overdue" : days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : "Due in " + days + " days";
      meta.pressure = content.blocker ? content.blocker : content.stage + " stage with " + (content.dependencies.length ? content.dependencies.length + " dependencies" : "clear dependencies");
    } else if (sponsor) {
      var sponsorDays = dateDiffDays(sponsor.deadline);
      meta.timeline = sponsorDays < 0 ? Math.abs(sponsorDays) + " days past sponsor deadline" : sponsorDays === 0 ? "Sponsor due today" : "Sponsor due in " + sponsorDays + " days";
      meta.pressure = sponsor.approval + " approval state • " + sponsor.paymentStatus + " payment state";
    } else if (campaign) {
      var campaignDays = dateDiffDays(campaign.deadline);
      meta.timeline = campaignDays < 0 ? Math.abs(campaignDays) + " days past launch deadline" : campaignDays === 0 ? "Campaign deadline today" : "Campaign due in " + campaignDays + " days";
      meta.pressure = campaign.waveLabel + " is at " + campaign.progress + "% progress";
    }

    if (cta === "route-viral") {
      meta.primaryLabel = "Generate alternatives";
      meta.secondaryCta = "route-hooks";
      meta.secondaryLabel = "Open hook lab";
      meta.marker = "Packaging risk";
    } else if (cta === "open-content") {
      meta.primaryLabel = lowerTitle.indexOf("overdue") > -1 || lowerTitle.indexOf("blocker") > -1 ? "Review blocker" : "Fix now";
      meta.secondaryCta = lowerTitle.indexOf("hook") > -1 || lowerTitle.indexOf("cta") > -1 ? "route-hooks" : "";
      meta.secondaryLabel = meta.secondaryCta ? "Generate alternatives" : "";
    } else if (cta === "open-sponsor") {
      meta.primaryLabel = "Fix now";
      meta.marker = "Sponsor risk";
    } else if (cta === "open-campaign") {
      meta.primaryLabel = "Open affected workflow";
      meta.marker = "Launch risk";
    } else if (cta === "route-calendar") {
      meta.primaryLabel = "Reschedule dependency";
      meta.marker = "Calendar pressure";
    } else if (cta === "route-pipeline") {
      meta.primaryLabel = "Open affected workflow";
      meta.marker = "Workflow pressure";
    }

    if (options.marker) meta.marker = options.marker;
    if (options.primaryLabel) meta.primaryLabel = options.primaryLabel;
    if (options.secondaryCta) meta.secondaryCta = options.secondaryCta;
    if (options.secondaryLabel) meta.secondaryLabel = options.secondaryLabel;
    if (options.trend) meta.trend = options.trend;
    if (options.timeline) meta.timeline = options.timeline;
    if (options.pressure) meta.pressure = options.pressure;
    return meta;
  }

  function buildReport(type) {
    var metrics = computeDashboardMetrics();
    var insights = computeInsights().slice(0, 6);
    var titleMap = {
      "content-plan": "ContentPilot Content Plan Report",
      campaign: "ContentPilot Campaign Progress Report",
      sponsor: "ContentPilot Sponsor Delivery Report",
      bottleneck: "ContentPilot Production Bottleneck Report",
      weekly: "ContentPilot Weekly Creator Operations Report"
    };
    var title = titleMap[type] || "ContentPilot Report";
    var filename = title.toLowerCase().replace(/\s+/g, "-") + ".html";
    var summary = "";
    var table = "";
    var headings = [];

    if (type === "campaign") {
      headings = ["Campaign", "Offer", "Wave", "Progress", "Deadline"];
      summary = "<p>Campaign momentum is " + metrics.campaignMomentum + "/100 with " + state.campaigns.length + " active launch plans in the workspace.</p>";
      table = state.campaigns.map(function (item) {
        return reportTableRow([item.name, item.offer, item.waveLabel, item.progress + "%", formatDate(item.deadline)]);
      }).join("");
    } else if (type === "sponsor") {
      headings = ["Sponsor", "Value", "Approval", "Payment", "Deadline"];
      summary = "<p>There are " + state.sponsors.length + " sponsor records with " + metrics.sponsorRiskCount + " currently flagged as risk-sensitive.</p>";
      table = state.sponsors.map(function (item) {
        return reportTableRow([item.name, "$" + item.value.toLocaleString(), item.approval, item.paymentStatus, formatDate(item.deadline)]);
      }).join("");
    } else if (type === "bottleneck") {
      headings = ["Stage", "Items", "Status", "Recommendation", "Window"];
      summary = "<p>Overdue production items: " + metrics.overdueCount + ". Review-stage congestion: " + metrics.reviewStuck + " items.</p>";
      table = computeStagePressure().map(function (item) {
        return reportTableRow([item.stage, String(item.count), item.count >= 3 ? "Pressure point" : "Stable", item.count >= 3 ? "Rebalance owners and clear blockers" : "Maintain flow", "Current"]);
      }).join("");
    } else if (type === "weekly") {
      headings = ["Content Item", "Platform", "Stage", "Readiness", "Deadline"];
      summary = "<p>Weekly operations health is " + metrics.healthScore + "/100 with publishing consistency marked as " + metrics.consistencyLabel + ".</p>";
      table = state.content.map(function (item) {
        var readiness = computeReadiness(item);
        return reportTableRow([item.title, item.platform, item.stage, readiness.label, formatDate(item.deadline)]);
      }).join("");
    } else {
      headings = ["Content Item", "Platform", "Readiness", "Opportunity", "Deadline"];
      summary = "<p>Readiness, opportunity scoring, and next-step recommendations are included for the current content workspace.</p>";
      table = state.content.map(function (item) {
        var readiness = computeReadiness(item);
        var viral = computeViralScore(item);
        return reportTableRow([item.title, item.platform, readiness.label, viral.total + "/100", formatDate(item.deadline)]);
      }).join("");
    }

    if (!table) table = reportEmptyRow(headings.length || 5, "No records available in the current workspace for this report.");

    var risks = insights.map(function (item) {
      return '<li><span class="report-list-label ' + item.tone + '">' + escapeHtml(item.marker) + '</span><div><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.shortReason || item.reason) + '</p></div></li>';
    }).join("");
    var recs = insights.map(function (item) {
      return '<li><strong>' + escapeHtml(item.primaryLabel || "Next move") + ':</strong> ' + escapeHtml(item.shortAction || item.action) + "</li>";
    }).join("");
    if (!risks) risks = "<li>No critical risks are active in the current workspace snapshot.</li>";
    if (!recs) recs = "<li>No priority recommendations are required right now.</li>";
    var metricsGrid =
      '<section class="report-metric-grid">' +
        reportMetricCard("Operational Pulse™", metrics.operationalPulseLabel, metrics.operationalPulseDetail) +
        reportMetricCard("Launch Confidence", metrics.launchConfidence + "/100", metrics.launchSignal) +
        reportMetricCard("Production Momentum", metrics.productionMomentum + "/100", metrics.momentumSignal) +
        reportMetricCard("Burnout Risk", metrics.burnoutRiskLabel, metrics.reviewSignal) +
      '</section>';
    return {
      title: title,
      filename: filename,
      html: buildHtmlReportDocument(title,
        '<section class="report-hero"><p class="report-kicker">Operational export</p><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(metrics.operationalPulseDetail) + '</p><div class="report-hero-meta"><span>Generated ' + escapeHtml(formatStamp(new Date())) + '</span><span>Local workspace export</span></div></section>' +
        metricsGrid +
        "<section><h2>Executive Summary</h2>" + summary + "</section>" +
        "<section><h2>Operational Snapshot</h2><ul class=\"report-bullet-grid\"><li><strong>Content Health Score</strong><span>" + metrics.healthScore + "/100</span></li><li><strong>Publishing Consistency</strong><span>" + escapeHtml(metrics.consistencyLabel) + "</span></li><li><strong>Overdue Production Items</strong><span>" + metrics.overdueCount + "</span></li><li><strong>Sponsor Risk Alerts</strong><span>" + metrics.sponsorRiskCount + "</span></li></ul></section>" +
        "<section><h2>Primary Risks</h2><ul class=\"report-risk-list\">" + risks + "</ul></section>" +
        "<section><h2>Recommendations</h2><ul class=\"report-recommendations\">" + recs + "</ul></section>" +
        "<section><h2>Item Table</h2><table><thead>" + reportHeaderRow(headings) + "</thead><tbody>" + table + "</tbody></table></section>"
      )
    };
  }

  function buildSingleContentReport(item) {
    var readiness = computeReadiness(item);
    var viral = computeViralScore(item);
    var repurpose = buildRepurposePlan(item).slice(0, 4);
    return buildHtmlReportDocument(item.title + " Content Plan",
      '<section class="report-hero"><p class="report-kicker">Content export</p><h2>' + escapeHtml(item.title) + '</h2><p>' + escapeHtml(item.description) + '</p><div class="report-hero-meta"><span>' + escapeHtml(item.platform) + '</span><span>' + escapeHtml(item.stage) + '</span><span>' + formatDate(item.deadline) + '</span></div></section>' +
      '<section class="report-metric-grid">' +
        reportMetricCard("Readiness", readiness.score + "/100", readiness.label) +
        reportMetricCard("Opportunity", viral.total + "/100", viral.recommendations[0]) +
        reportMetricCard("Stage", item.stage, "Current workflow position") +
        reportMetricCard("Platform", item.platform, "Primary release channel") +
      '</section>' +
      "<section><h2>Readiness</h2><p>" + readiness.score + "/100 • " + escapeHtml(readiness.label) + "</p><p>" + escapeHtml(readiness.summary) + "</p></section>" +
      "<section><h2>Opportunity Score</h2><p>" + viral.total + "/100</p><ul class=\"report-recommendations\">" + viral.recommendations.map(function (entry) { return "<li>" + escapeHtml(entry) + "</li>"; }).join("") + "</ul></section>" +
      "<section><h2>Repurposing Recommendations</h2><ul>" + repurpose.map(function (entry) { return "<li><strong>" + escapeHtml(entry.platform) + ":</strong> " + escapeHtml(entry.angle) + "</li>"; }).join("") + "</ul></section>"
    );
  }

  function buildHtmlReportDocument(title, body) {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + escapeHtml(title) + '</title><style>body{margin:0;font-family:Segoe UI,Tahoma,sans-serif;background:#eef3fb;color:#14203a;padding:36px}main{max-width:1040px;margin:0 auto;background:#fff;border-radius:30px;padding:42px;box-shadow:0 24px 70px rgba(17,32,61,.12)}h1,h2{letter-spacing:-.04em;margin:0 0 10px}h2{font-size:1.4rem}p{line-height:1.68}section{margin-top:26px;padding-top:18px;border-top:1px solid #e7edf7}.eyebrow,.report-kicker{font-size:12px;text-transform:uppercase;letter-spacing:.18em;color:#7384a6;margin:0 0 8px}.report-hero{margin-top:0;padding-top:0;border-top:none;padding:28px;border-radius:24px;background:linear-gradient(135deg,#0f1b35,#15284c 55%,#1f3568);color:#f4f8ff}.report-hero h2{font-size:2.05rem;margin-bottom:8px}.report-hero p{max-width:760px;color:#d9e6ff}.report-hero-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.report-hero-meta span{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:.82rem}.report-metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:22px}.report-metric{padding:18px;border:1px solid #e7edf7;border-radius:20px;background:#f8fbff}.report-metric span{display:block;color:#66789d;font-size:.78rem;text-transform:uppercase;letter-spacing:.12em}.report-metric strong{display:block;margin-top:10px;font-size:1.3rem;letter-spacing:-.03em}.report-metric p{margin:10px 0 0;color:#445371;font-size:.95rem}.report-bullet-grid,.report-risk-list,.report-recommendations{list-style:none;padding:0;margin:0;display:grid;gap:12px}.report-bullet-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.report-bullet-grid li,.report-risk-list li,.report-recommendations li{padding:14px 16px;border-radius:18px;background:#f8fbff;border:1px solid #e7edf7}.report-bullet-grid li{display:flex;justify-content:space-between;gap:16px;align-items:center}.report-bullet-grid li span{font-weight:700}.report-risk-list li{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:flex-start}.report-risk-list li p{margin:6px 0 0;color:#445371}.report-list-label{display:inline-flex;align-items:center;justify-content:center;padding:7px 10px;border-radius:999px;font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;border:1px solid #e7edf7;background:#fff;height:max-content}.report-list-label.is-danger{color:#c54969;border-color:rgba(197,73,105,.18);background:#fff4f7}.report-list-label.is-warning{color:#b17b16;border-color:rgba(177,123,22,.18);background:#fff9ef}.report-list-label.is-info{color:#3468d0;border-color:rgba(52,104,208,.18);background:#f3f7ff}ul{padding-left:20px;line-height:1.7}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{padding:12px 10px;border-bottom:1px solid #e8eef8;vertical-align:top;text-align:left;overflow-wrap:anywhere}th{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#66789d;background:#f7f9fd}@media (max-width:860px){body{padding:18px}main{padding:24px}.report-metric-grid,.report-bullet-grid{grid-template-columns:1fr}.report-risk-list li{grid-template-columns:1fr}}@media print{body{padding:0;background:#fff}main{box-shadow:none;border-radius:0;padding:28px}.report-hero{background:#fff;color:#14203a;border:1px solid #e7edf7}.report-hero p{color:#445371}.report-hero-meta span{background:#fff;border-color:#e7edf7}}</style></head><body><main><p class="eyebrow">Generated by ContentPilot</p><h1>' + escapeHtml(title) + '</h1>' + body + '</main></body></html>';
  }

  function reportMetricCard(label, value, detail) {
    return '<div class="report-metric"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong><p>' + escapeHtml(detail) + '</p></div>';
  }

  function reportTableRow(cells) {
    return "<tr>" + cells.map(function (cell) { return "<td>" + escapeHtml(cell) + "</td>"; }).join("") + "</tr>";
  }

  function reportHeaderRow(cells) {
    return "<tr>" + cells.map(function (cell) { return "<th>" + escapeHtml(cell) + "</th>"; }).join("") + "</tr>";
  }

  function reportEmptyRow(colSpan, message) {
    return '<tr><td colspan="' + colSpan + '">' + escapeHtml(message) + "</td></tr>";
  }

  function saveViralResultToContent(id) {
    var item = getContentById(id);
    if (!item) return;
    mutate("Opportunity score saved", function () {
      item.lastOpportunityScore = computeViralScore(item).total;
    });
    render();
  }

  function generateHookIdeasForSelected() {
    var item = getSelectedContent();
    if (!item) return toast("No content selected", "Create or select a content item before generating hook directions.");
    var ideas = [
      "The hidden reason " + item.topic.toLowerCase() + " keeps slowing good teams down.",
      "Why your next " + item.platform + " post will underperform unless you fix this first.",
      "The fastest way to improve " + item.topic.toLowerCase() + " without adding more work.",
      "What most teams get wrong before " + item.stage.toLowerCase() + " even starts."
    ];
    ui.generatedHookIdeas = ideas.map(function (text, index) {
      return { id: index, text: text, platform: item.platform };
    });
    ui.selectedHookDraft = ideas[0];
    openModal("Generated Hook Ideas", "Hook Laboratory", '<div class="stack">' + ui.generatedHookIdeas.map(function (idea) {
      return '<div class="list-item"><h4>' + escapeHtml(idea.text) + '</h4><div class="inline-actions"><button class="button button-ghost" data-action="load-generated-hook" data-id="' + idea.id + '">Load draft</button><button class="button button-ghost" data-action="save-generated-hook" data-id="' + idea.id + '">Save to lab</button></div></div>';
    }).join("") + '</div>');
  }

  function loadGeneratedHook(index) {
    var idea = ui.generatedHookIdeas[index];
    if (!idea) return;
    ui.selectedHookDraft = idea.text;
    closeModal();
    window.location.hash = "hooks";
    toast("Hook draft loaded", "Generated idea moved into the Hook Laboratory.");
    render();
  }

  function saveGeneratedHookByIndex(index) {
    var idea = ui.generatedHookIdeas[index];
    if (!idea) return;
    var duplicate = state.hooks.some(function (hook) {
      return hook.text.trim().toLowerCase() === idea.text.trim().toLowerCase();
    });
    if (duplicate) return toast("Duplicate hook blocked", "That generated hook already exists in the Hook Laboratory.");
    mutate("Hook saved", function () {
      state.hooks.unshift({ id: uid("hook"), text: idea.text, category: "Curiosity", platform: idea.platform, favorite: false });
    });
    render();
  }

  function copyRepurposeAngle(platform) {
    var item = getSelectedContent();
    if (!item) return toast("No content selected", "Create or select a content item before copying repurposing guidance.");
    var plan = buildRepurposePlan(item).filter(function (entry) { return entry.platform === platform; })[0];
    if (!plan) return;
    copyText(plan.angle);
  }

  function saveRepurposeAngle(platform) {
    var item = getSelectedContent();
    if (!item) return toast("No content selected", "Create or select a content item before saving repurposing guidance.");
    var plan = buildRepurposePlan(item).filter(function (entry) { return entry.platform === platform; })[0];
    if (!plan) return;
    mutate("Vault item saved", function () {
      state.vault.unshift({
        id: uid("vault"),
        title: item.title + " • " + plan.platform,
        category: "Campaign Idea",
        tags: [plan.platform.toLowerCase().replace(/\s+/g, "-"), "repurpose"],
        content: plan.angle,
        favorite: false
      });
    });
    render();
  }

  function toggleVaultFavorite(id) {
    mutate("Vault item updated", function () {
      var item = findById(state.vault, id);
      if (!item) return;
      item.favorite = !item.favorite;
    });
    render();
  }

  function jumpToLowestScoringItem() {
    var candidate = state.content.slice().sort(function (a, b) { return computeViralScore(a).total - computeViralScore(b).total; })[0];
    if (!candidate) return toast("No low-score items", "Create content items first so the scoring engine has records to evaluate.");
    ui.selectedContentId = candidate.id;
    window.location.hash = "viral";
  }

  function buildImprovedHookExample(item) {
    var topic = item.topic || item.title;
    return "Most teams think " + topic.toLowerCase() + " is a consistency problem. It is usually a hidden workflow problem that kills the result before publishing even starts.";
  }

  function applyTheme() {
    els.body.setAttribute("data-theme", state.settings.theme === "light" ? "light" : "dark");
  }

  function validateContentData(data) {
    if (!String(data.title || "").trim()) return "Content title is required.";
    if (!String(data.description || "").trim()) return "Content description is required.";
    if (!String(data.platform || "").trim()) return "Platform selection is required.";
    if (!String(data.deadline || "").trim()) return "Deadline is required.";
    if (!String(data.topic || "").trim()) return "Topic is required for insight and repetition detection.";
    return "";
  }

  function confirmDeleteContent(id) {
    var item = findById(state.content, id);
    if (!item) return;
    openConfirmModal("Delete content item", "This will remove the content item and any linked script selection may fall back to another record.", "Delete", function () {
      mutate("Content item deleted", function () {
        state.content = state.content.filter(function (entry) { return entry.id !== id; });
        state.scripts = state.scripts.filter(function (entry) { return entry.contentId !== id; });
      });
      closeModal();
      ensureSelections();
      render();
    });
  }

  function confirmDeleteHook(id) {
    var item = findById(state.hooks, id);
    if (!item) return;
    openConfirmModal("Delete hook", "This will remove the saved hook from the Hook Laboratory.", "Delete", function () {
      mutate("Hook deleted", function () {
        state.hooks = state.hooks.filter(function (entry) { return entry.id !== id; });
      });
      closeModal();
      render();
    });
  }

  function confirmDeleteScript(id) {
    var item = findById(state.scripts, id);
    if (!item) return;
    openConfirmModal("Delete script", "This will permanently remove the selected script record.", "Delete", function () {
      mutate("Script deleted", function () {
        state.scripts = state.scripts.filter(function (entry) { return entry.id !== id; });
      });
      closeModal();
      ensureSelections();
      render();
    });
  }

  function confirmDeleteCampaign(id) {
    var item = findById(state.campaigns, id);
    if (!item) return;
    openConfirmModal("Delete campaign", "This will remove the campaign and unassign it from connected content items.", "Delete", function () {
      mutate("Campaign deleted", function () {
        state.campaigns = state.campaigns.filter(function (entry) { return entry.id !== id; });
        state.content.forEach(function (entry) { if (entry.campaignId === id) entry.campaignId = ""; });
      });
      closeModal();
      ensureSelections();
      render();
    });
  }

  function confirmDeleteSponsor(id) {
    var item = findById(state.sponsors, id);
    if (!item) return;
    openConfirmModal("Delete sponsor deal", "This will remove the sponsor and unlink it from content items.", "Delete", function () {
      mutate("Sponsor deleted", function () {
        state.sponsors = state.sponsors.filter(function (entry) { return entry.id !== id; });
        state.content.forEach(function (entry) { if (entry.sponsorId === id) entry.sponsorId = ""; });
      });
      closeModal();
      ensureSelections();
      render();
    });
  }

  function confirmDeleteNote(id) {
    var item = findById(state.notes, id);
    if (!item) return;
    openConfirmModal("Delete team note", "This will remove the note from the Team Workspace.", "Delete", function () {
      mutate("Team note deleted", function () {
        state.notes = state.notes.filter(function (entry) { return entry.id !== id; });
      });
      closeModal();
      render();
    });
  }

  function confirmDeleteVault(id) {
    var item = findById(state.vault, id);
    if (!item) return;
    openConfirmModal("Delete vault item", "This will remove the selected asset from the Swipe Vault.", "Delete", function () {
      mutate("Vault item deleted", function () {
        state.vault = state.vault.filter(function (entry) { return entry.id !== id; });
      });
      closeModal();
      render();
    });
  }

  function isValidWorkspaceBackup(parsed) {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    var required = ["team", "content", "hooks", "scripts", "campaigns", "sponsors", "approvals", "notes", "vault", "settings"];
    return required.every(function (key) { return Object.prototype.hasOwnProperty.call(parsed, key); });
  }

  function toast(title, detail) {
    var id = uid("toast");
    var node = document.createElement("div");
    node.className = "toast";
    node.innerHTML = "<strong>" + escapeHtml(title) + '</strong><div class="helper-text" style="margin-top:6px;">' + escapeHtml(detail) + '</div><div class="inline-actions" style="margin-top:10px;"><button class="button button-ghost" data-action="dismiss-toast" data-id="' + id + '">Dismiss</button></div>';
    node.setAttribute("data-toast-id", id);
    els.toastStack.prepend(node);
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 4200);
  }

  function showLoadingToast(label) {
    var id = uid("toast");
    var node = document.createElement("div");
    node.className = "toast";
    node.innerHTML = '<div class="loading-state">' + escapeHtml(label) + '</div>';
    node.setAttribute("data-toast-id", id);
    els.toastStack.prepend(node);
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 1200);
  }

  function dismissToast(id) {
    var toastNode = els.toastStack.querySelector('[data-toast-id="' + id + '"]');
    if (toastNode && toastNode.parentNode) toastNode.parentNode.removeChild(toastNode);
  }

  function downloadTextFile(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function copyText(text) {
    var clean = String(text || "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(clean).then(function () {
        toast("Copied to clipboard", "The repurposing angle is ready to paste.");
      }).catch(function () {
        fallbackCopyText(clean);
      });
      return;
    }
    fallbackCopyText(clean);
  }

  function fallbackCopyText(text) {
    var input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "readonly");
    input.style.position = "absolute";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      toast("Copied to clipboard", "The repurposing angle is ready to paste.");
    } catch (error) {
      toast("Copy not available", "Clipboard access was blocked in this browser.");
    }
    document.body.removeChild(input);
  }

  function exportHtmlFile(filename, content) {
    downloadTextFile(filename, content, "text/html;charset=utf-8");
    toast("HTML exported", filename + " was generated locally.");
  }

  function getInitialRoute() {
    var hash = window.location.hash.replace("#", "").trim();
    return ROUTES.some(function (route) { return route.id === hash; }) ? hash : "dashboard";
  }

  function getRouteMeta(id) {
    return ROUTES.filter(function (route) { return route.id === id; })[0] || ROUTES[0];
  }

  function groupByStage(items) {
    return items.reduce(function (acc, item) {
      if (!acc[item.stage]) acc[item.stage] = [];
      acc[item.stage].push(item);
      return acc;
    }, {});
  }

  function fieldInput(label, name, value, extraClass, type) {
    return '<div class="field ' + (extraClass || "") + '"><label>' + escapeHtml(label) + '</label><input type="' + (type || "text") + '" name="' + escapeHtml(name) + '" value="' + escapeHtml(value || "") + '"></div>';
  }

  function fieldTextarea(label, name, value, extraClass) {
    return '<div class="field ' + (extraClass || "") + '"><label>' + escapeHtml(label) + '</label><textarea name="' + escapeHtml(name) + '">' + escapeHtml(value || "") + '</textarea></div>';
  }

  function fieldSelect(label, name, options, value) {
    var normalized = options.map(function (option) {
      return typeof option === "string" ? { value: option, label: option } : option;
    });
    return '<div class="field"><label>' + escapeHtml(label) + '</label><select name="' + escapeHtml(name) + '">' + normalized.map(function (option) {
      var selected = String(option.value) === String(value) ? ' selected' : "";
      return '<option value="' + escapeHtml(option.value) + '"' + selected + '>' + escapeHtml(option.label) + '</option>';
    }).join("") + '</select></div>';
  }

  function formActions(label, secondaryHtml) {
    return '<div class="field field-full"><div class="inline-actions"><button class="button button-primary" type="submit">' + escapeHtml(label) + '</button>' + (secondaryHtml || "") + '<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button></div></div>';
  }

  function hiddenField(name, value) {
    return '<input type="hidden" name="' + escapeHtml(name) + '" value="' + escapeHtml(value || "") + '">';
  }

  function objectFromForm(formData) {
    var out = {};
    formData.forEach(function (value, key) { out[key] = value; });
    return out;
  }

  function hasOwnList(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key) && Array.isArray(object[key]);
  }

  function normalizeContentInput(data) {
    var existing = data.id ? findById(state.content, data.id) : null;
    return normalizeContentRecord(Object.assign({}, existing || createEmptyContent(), {
      id: data.id || uid("content"),
      title: data.title,
      description: data.description,
      platform: data.platform,
      stage: data.stage,
      assigneeId: data.assigneeId,
      deadline: data.deadline,
      priority: data.priority,
      topic: data.topic,
      dependencies: splitTags(data.dependencies),
      blocker: data.blocker,
      hook: data.hook,
      cta: data.cta,
      campaignId: data.campaignId,
      sponsorId: data.sponsorId
    }));
  }

  function createEmptyContent() {
    return {
      id: "",
      title: "",
      description: "",
      platform: "YouTube",
      stage: "Idea",
      deadline: todayOffset(5),
      priority: "Medium",
      assigneeId: state.team[0].id,
      topic: "",
      dependencies: [],
      blocker: "",
      hook: "",
      cta: "",
      campaignId: "",
      sponsorId: "",
      lastOpportunityScore: 0,
      thumbnailPlan: { direction: "Curious", textPlacement: "Minimal text", clutter: "Balanced", focus: "Result reveal" }
    };
  }

  function createEmptyScript() {
    return { id: "", title: "", contentId: state.content.length ? state.content[0].id : "", sections: { hook: "", intro: "", story: "", value: "", proof: "", cta: "" } };
  }

  function createEmptyCampaign() {
    return { id: "", name: "", offer: "", waveLabel: "", deadline: todayOffset(7), progress: 0, sequence: ["Announcement asset", "Hero publish", "Short-form clips", "Email follow-up"] };
  }

  function createEmptySponsor() {
    return { id: "", name: "", value: 0, approval: "Briefing", paymentStatus: "Pending", deadline: todayOffset(7), deliverables: ["Integrated mention"], notes: "" };
  }

  function createEmptyNote() {
    return { id: "", title: "", body: "", assigneeId: state.team[0].id, type: "Review", done: false };
  }

  function createEmptyVaultItem() {
    return { id: "", title: "", category: "Hook", tags: [], content: "", favorite: false };
  }

  function createSeedState() {
    return {
      team: [
        { id: "team-1", name: "Maya Chen", role: "Content Director" },
        { id: "team-2", name: "Leo Carter", role: "Producer" },
        { id: "team-3", name: "Sofia Malik", role: "Editor" },
        { id: "team-4", name: "Noah Rivera", role: "Growth Strategist" }
      ],
      content: [
        { id: "content-1", title: "YouTube Launch: The Creator Ops System That Saved Our Weekly Publish", description: "Hero launch video for a creator operations audit offer, built around workflow chaos and operational recovery.", platform: "YouTube", stage: "Editing", deadline: todayOffset(2), priority: "Critical", assigneeId: "team-3", topic: "creator operations systems", dependencies: ["Sponsor notes", "Thumbnail direction"], blocker: "Awaiting final b-roll exports and legal note integration.", hook: "Most creator teams are not losing consistency because of bad ideas. They are losing because the operation behind the content is broken.", cta: "Download the weekly creator ops checklist from the newsletter.", campaignId: "campaign-1", sponsorId: "sponsor-1", lastOpportunityScore: 74, thumbnailPlan: { direction: "Urgent", textPlacement: "Minimal text", clutter: "Balanced", focus: "Before/after" } },
        { id: "content-2", title: "TikTok Sprint: Why Most Podcast Clips Die Before 5 Seconds", description: "Short-form retention breakdown for podcast studios and creator teams repurposing long-form shows.", platform: "TikTok", stage: "Thumbnail", deadline: todayOffset(1), priority: "High", assigneeId: "team-2", topic: "podcast clip retention", dependencies: ["Captions", "Sound cleanup"], blocker: "", hook: "If your clip needs context before the payoff, the swipe already happened.", cta: "Save this and audit your next three clips tonight.", campaignId: "campaign-2", sponsorId: "", lastOpportunityScore: 82, thumbnailPlan: { direction: "Shock", textPlacement: "Left focus", clutter: "Minimal", focus: "Face reaction" } },
        { id: "content-3", title: "Instagram Reel Series: The Hidden Cost of Late Sponsor Approval", description: "Operational mini-series connecting delayed sponsor reviews with missed publishing windows and stressed teams.", platform: "Instagram Reel", stage: "Sponsor Approval", deadline: todayOffset(-1), priority: "Critical", assigneeId: "team-1", topic: "sponsor approval delays", dependencies: ["Brand script signoff"], blocker: "Sponsor legal team requested revised mention language.", hook: "A slow sponsor approval does not only delay one reel. It can wreck the entire publishing week behind it.", cta: "Share this with the person who keeps chasing sponsor approvals manually.", campaignId: "campaign-1", sponsorId: "sponsor-2", lastOpportunityScore: 68, thumbnailPlan: { direction: "Urgent", textPlacement: "Right focus", clutter: "Balanced", focus: "Object contrast" } },
        { id: "content-4", title: "LinkedIn Breakdown: How Agencies Turn One Client Shoot Into 12 Assets", description: "B2B distribution case study for agencies building content engines from a single shoot day.", platform: "LinkedIn Post", stage: "Scheduled", deadline: todayOffset(4), priority: "Medium", assigneeId: "team-4", topic: "content repurposing systems", dependencies: ["Carousel adaptation"], blocker: "", hook: "The agencies shipping fastest are not creating more. They are extracting more value from every shoot day.", cta: "Comment repurpose if you want the full process map.", campaignId: "campaign-3", sponsorId: "", lastOpportunityScore: 79, thumbnailPlan: { direction: "Authority", textPlacement: "Top banner", clutter: "Balanced", focus: "Result reveal" } },
        { id: "content-5", title: "Carousel Series: Our Weekly Creator Ops Meeting Template", description: "Process-driven carousel for teams that need better weekly planning and fewer reactive check-ins.", platform: "Carousel", stage: "Review", deadline: todayOffset(3), priority: "Medium", assigneeId: "team-1", topic: "creator operations systems", dependencies: [], blocker: "", hook: "One 20-minute ops meeting can eliminate a week of chaotic follow-up if the agenda is built correctly.", cta: "Save the carousel and run this agenda with your team this week.", campaignId: "campaign-1", sponsorId: "", lastOpportunityScore: 72, thumbnailPlan: { direction: "Relief", textPlacement: "Bottom tag", clutter: "Balanced", focus: "Big claim" } },
        { id: "content-6", title: "Shorts Lesson: The Thumbnail Mistake That Makes Good Videos Look Weak", description: "Packaging lesson for creators improving click-through rate without over-designing cover art.", platform: "Shorts", stage: "Published", deadline: todayOffset(-2), priority: "High", assigneeId: "team-4", topic: "thumbnail clarity", dependencies: [], blocker: "", hook: "If the viewer cannot decode the story in one glance, your packaging is already making the video work too hard.", cta: "Share this with the editor who keeps over-designing your covers.", campaignId: "campaign-2", sponsorId: "", lastOpportunityScore: 84, thumbnailPlan: { direction: "Curious", textPlacement: "Minimal text", clutter: "Minimal", focus: "Result reveal" } }
      ],
      hooks: [
        { id: "hook-1", text: "Most creator teams are not disorganized. They are operating without a real production system.", category: "Authority", platform: "YouTube", favorite: true },
        { id: "hook-2", text: "If your short needs context before the payoff, the swipe already happened.", category: "Problem/Solution", platform: "TikTok", favorite: false },
        { id: "hook-3", text: "The real reason your sponsor workflow feels chaotic has nothing to do with your editor.", category: "Curiosity", platform: "Instagram Reel", favorite: true },
        { id: "hook-4", text: "The easiest way to miss a publish deadline is to ignore what happens before editing starts.", category: "Urgency", platform: "YouTube", favorite: false }
      ],
      scripts: [
        { id: "script-1", title: "Creator Ops Launch Video", contentId: "content-1", sections: { hook: "Most creator teams are not losing consistency because of bad ideas. They are losing because the operation behind the content is broken.", intro: "Today I am showing the exact creator ops system that pulled our weekly publishing rhythm out of chaos.", story: "We reached a point where every upload was late, sponsor tasks stacked up, and editing turned into recovery instead of process.", value: "I will break down planning, packaging, approvals, repurposing, and the weekly review cadence that fixed the bottlenecks.", proof: "After implementing this structure, our team recovered consistency, protected sponsor delivery, and reduced review churn.", cta: "Download the checklist and run the same weekly operating rhythm with your own team." } },
        { id: "script-2", title: "Sponsor Delay Breakdown", contentId: "content-3", sections: { hook: "A slow sponsor approval does not just delay one reel. It can quietly damage the entire week behind it.", intro: "Sponsor chaos usually looks like a communication problem, but it is really an operations design problem.", story: "We watched one delayed legal change push editing, packaging, and short-form cutdowns into overtime.", value: "Here is how to structure handoffs, approval checkpoints, and sponsor locks before production breaks.", proof: "The last three sponsor-backed launch waves using this structure cleared faster and needed fewer late changes.", cta: "Use this workflow the next time a sponsor asks for a late revision." } }
      ],
      campaigns: [
        { id: "campaign-1", name: "Creator Ops Launch Week", offer: "Content Operations Audit", waveLabel: "Wave A", deadline: todayOffset(6), progress: 64, sequence: ["Hero YouTube publish", "Instagram reel cutdown", "Carousel meeting template", "Newsletter follow-up"] },
        { id: "campaign-2", name: "TikTok Sprint for Pod Studios", offer: "Short-Form Repurposing Pack", waveLabel: "Wave B", deadline: todayOffset(5), progress: 46, sequence: ["Problem clip", "Retention lesson", "CTA follow-up short", "Email teaser"] },
        { id: "campaign-3", name: "Agency Distribution Proof Series", offer: "Agency Content System Workshop", waveLabel: "Wave C", deadline: todayOffset(10), progress: 72, sequence: ["LinkedIn proof post", "Carousel adaptation", "Client shoot case story"] }
      ],
      sponsors: [
        { id: "sponsor-1", name: "StudioStack", value: 12000, approval: "Review", paymentStatus: "Invoiced", deadline: todayOffset(2), deliverables: ["Integrated mention in hero YouTube video", "LinkedIn support post", "Usage rights note"], notes: "Brand wants emphasis on multi-editor coordination and production visibility." },
        { id: "sponsor-2", name: "CueTrack", value: 8500, approval: "Briefing", paymentStatus: "Pending", deadline: todayOffset(1), deliverables: ["Integrated mention in Instagram reel series", "Short-form adaptation approval"], notes: "Legal review is the current blocker and must clear before scheduling." }
      ],
      approvals: [
        { id: "approval-1", title: "Creator Ops hero cut", status: "Review", owner: "Maya Chen", note: "Needs final framing note before schedule lock." },
        { id: "approval-2", title: "Carousel meeting template", status: "Briefing", owner: "Leo Carter", note: "Waiting on simplification pass for slide two and three." }
      ],
      notes: [
        { id: "note-1", title: "Watch sponsor revision timing", body: "CueTrack revisions cannot land after edit lock or the week breaks again.", assigneeId: "team-1", type: "Blocker", done: false },
        { id: "note-2", title: "LinkedIn angle is too creator-heavy", body: "Reframe toward agency ops and business outcomes before scheduling.", assigneeId: "team-4", type: "Strategy", done: false }
      ],
      vault: [
        { id: "vault-1", title: "Tension-first CTA", category: "CTA", tags: ["conversion", "email"], content: "If this exposed the bottleneck in your own workflow, the checklist link is where to start." },
        { id: "vault-2", title: "Sponsor delay title", category: "Title", tags: ["sponsor", "operations"], content: "The Hidden Cost of Late Sponsor Approval" },
        { id: "vault-3", title: "Result reveal concept", category: "Thumbnail Concept", tags: ["youtube", "packaging"], content: "Before-and-after production board showing chaos versus controlled pipeline." }
      ],
      reports: [],
      activity: [
        { id: "act-1", title: "StudioStack sponsor updated", detail: "Approval is still in review with deadline pressure building.", when: "18 min ago" },
        { id: "act-2", title: "Shorts thumbnail lesson published", detail: "Distribution mix improved across short-form channels.", when: "2 hr ago" },
        { id: "act-3", title: "Carousel meeting template entered review", detail: "Awaiting internal simplification pass.", when: "4 hr ago" },
        { id: "act-4", title: "Creator Ops launch cut moved to editing", detail: "B-roll and sponsor note dependencies remain open.", when: "Yesterday" }
      ],
      settings: { theme: "dark", onboardingComplete: false },
      archivedAlerts: []
    };
  }

  function findById(list, id) {
    return (list || []).filter(function (item) { return item.id === id; })[0] || null;
  }

  function upsertById(list, item) {
    var index = list.findIndex(function (entry) { return entry.id === item.id; });
    if (index === -1) list.unshift(item);
    else list[index] = item;
  }

  function nextApprovalState(current) {
    if (current === "Briefing") return "Review";
    if (current === "Review") return "Approved";
    return "Briefing";
  }

  function nextPaymentState(current) {
    if (current === "Pending") return "Invoiced";
    if (current === "Invoiced") return "Paid";
    return "Pending";
  }

  function approvalClass(status) {
    if (status === "Approved") return "is-success";
    if (status === "Review") return "is-warning";
    return "is-info";
  }

  function priorityClass(priority) {
    if (priority === "Critical") return "is-danger";
    if (priority === "High") return "is-warning";
    if (priority === "Medium") return "is-info";
    return "is-success";
  }

  function splitLines(value) {
    return String(value || "").split(/\r?\n/).map(function (item) { return item.trim(); }).filter(Boolean);
  }

  function splitTags(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value || "").split(",").map(function (item) { return item.trim(); }).filter(Boolean);
  }

  function containsAny(text, tokens) {
    var lower = String(text || "").toLowerCase();
    return tokens.some(function (token) { return lower.indexOf(token.toLowerCase()) > -1; });
  }

  function average(numbers) {
    if (!numbers.length) return 0;
    return numbers.reduce(function (sum, value) { return sum + value; }, 0) / numbers.length;
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  function toneByValue(value, high, medium) {
    if (value >= high) return "is-success";
    if (value >= medium) return "is-warning";
    return "is-danger";
  }

  function isoDate(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function todayOffset(days) {
    var date = new Date();
    date.setDate(date.getDate() + days);
    return isoDate(date);
  }

  function formatDate(value) {
    var date = new Date(value + "T00:00:00");
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatStamp(date) {
    return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function isOverdue(value) {
    return dateDiffDays(value) < 0;
  }

  function dateDiffDays(value) {
    var current = new Date();
    var now = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    var target = new Date(value + "T00:00:00");
    return Math.round((target.getTime() - now.getTime()) / 86400000);
  }

  function stagePressureLabel(count) {
    if (count >= 4) return "Congested lane";
    if (count >= 2) return "Monitor this queue";
    return "Healthy flow";
  }

  function inferActivityTone(item) {
    var text = (String(item.title || "") + " " + String(item.detail || "")).toLowerCase();
    if (containsAny(text, ["overdue", "risk", "blocked", "delay", "approval"])) return "is-warning";
    if (containsAny(text, ["published", "improved", "completed", "paid"])) return "is-success";
    return "is-info";
  }

  function getMemberName(id) {
    var member = findById(state.team, id);
    return member ? member.name : "Unassigned";
  }

  function createActivity(title, detail, when) {
    state.activity.unshift({ id: uid("act"), title: title, detail: detail, when: when || "Just now" });
    state.activity = state.activity.slice(0, 20);
  }

  function platformMatchScore(platform, stage) {
    var base = 72;
    if (platform === "YouTube") base = 80;
    else if (platform === "Shorts" || platform === "TikTok" || platform === "Instagram Reel") base = 76;
    else if (platform === "LinkedIn Post") base = 70;
    else if (platform === "Email Teaser") base = 68;
    if (stage === "Published" || stage === "Scheduled") base += 4;
    return clampNumber(base, 40, 94);
  }

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 9);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isFormField(element) {
    if (!element) return false;
    var tag = element.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable;
  }

  function isPreviewMode() {
    return /(?:\?|&)capture=1(?:&|$)/.test(window.location.search);
  }
})();
