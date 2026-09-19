"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useRouter } from "next/navigation";
import type {
  Competitor,
  ResearchReport,
  ResearchSource,
  SWOTPoint,
} from "@/lib/research-types";

type HistoryItem = {
  id: string;
  title: string;
  query: string;
  createdAt?: string;
};

function normalizeResearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\/(www\.)?/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateResearchTopic(query: string): string {
  const value = query.trim();

  if (!value) {
    return "Product idea or industry is required.";
  }

  if (value.length < 3) {
    return "Invalid research topic format. Please enter a clear product, company, service, or industry.";
  }

  if (value.length > 200) {
    return "Please keep the research topic under 200 characters.";
  }

  const normalized = normalizeResearchText(value);

  const invalidPlaceholders = new Set([
    "test",
    "testing",
    "test123",
    "abcd",
    "abcde",
    "abcdef",
    "asdf",
    "asdfgh",
    "asdfghjkl",
    "qwerty",
    "qwertyuiop",
    "zxcv",
    "zxcvbn",
    "xyz",
    "xyzabc",
    "hello",
    "sample",
    "example",
    "dummy",
    "random",
    "none",
    "null",
    "undefined",
    "na",
    "123",
    "1234",
    "12345",
  ]);

  if (invalidPlaceholders.has(normalized)) {
    return "Please enter a meaningful product idea, company, service, or industry.";
  }

  const alphabeticCharacters = (
    normalized.match(/[a-z]/g) || []
  ).length;

  if (alphabeticCharacters < 2) {
    return "Please enter a meaningful product idea, company, service, or industry.";
  }

  const compactValue = normalized.replace(/\s/g, "");

  if (/^(.)\1{3,}$/i.test(compactValue)) {
    return "Invalid research topic format. Please enter a meaningful research topic.";
  }

  const keyboardPatterns = [
    "asdf",
    "qwer",
    "zxcv",
    "hjkl",
    "dfgh",
    "jkl",
  ];

  if (
    compactValue.length <= 12 &&
    keyboardPatterns.some((pattern) =>
      compactValue.includes(pattern)
    )
  ) {
    return "Please enter a meaningful product idea, company, service, or industry.";
  }

  const allowedShortTerms = new Set([
    "ai",
    "ml",
    "saas",
    "fintech",
    "healthtech",
    "edtech",
    "insurtech",
    "proptech",
    "agritech",
    "biotech",
    "medtech",
    "deeptech",
    "web3",
    "crypto",
    "banking",
    "payments",
    "insurance",
    "education",
    "healthcare",
    "finance",
    "software",
    "security",
    "cybersecurity",
    "ecommerce",
    "retail",
    "logistics",
    "automotive",
    "travel",
    "gaming",
    "fitness",
    "marketing",
    "analytics",
    "robotics",
  ]);

  const words = normalized.split(" ").filter(Boolean);

  if (words.length === 1 && !allowedShortTerms.has(words[0])) {
    const word = words[0];

    const vowels = (word.match(/[aeiou]/g) || []).length;
    const consonants = (
      word.match(/[bcdfghjklmnpqrstvwxyz]/g) || []
    ).length;

    if (word.length <= 5 && consonants >= 3 && vowels <= 1) {
      return "Please enter a meaningful product idea, company, service, or industry.";
    }
  }

  return "";
}

export default function Home() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");

  // Closed initially so mobile does not open with the sidebar covering the page.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(true);

  const [query, setQuery] = useState("");
  const [geographicMarket, setGeographicMarket] = useState("");
  const [targetUser, setTargetUser] = useState("");

  const [report, setReport] = useState<ResearchReport | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [competitorSearch, setCompetitorSearch] = useState("");
  const [sortField, setSortField] =
    useState<keyof Competitor>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /*
   * Authentication
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /*
   * Read theme from the server-rendered html element.
   * The actual saved theme comes from the cookie in app/layout.tsx.
   */
  useEffect(() => {
    const theme =
      document.documentElement.dataset.theme || "dark";

    setDarkMode(theme === "dark");
  }, []);

  /*
   * Desktop sidebar open.
   * Mobile sidebar closed.
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me");

      if (!response.ok) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      setUserEmail(data.user?.email || "");

      await loadHistory();
    } catch (error) {
      console.error("Authentication check failed:", error);
      router.push("/login");
    }
  }

  async function loadHistory() {
    try {
      setHistoryLoading(true);

      const response = await fetch("/api/research/history", {
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error("Unable to load research history.");
      }

      const data = await response.json();
      setHistory(data.reports || []);
    } catch (error) {
      console.error("History loading error:", error);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleResearch(event: FormEvent) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const validationError = validateResearchTopic(query);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setReport(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          geographicMarket: geographicMarket.trim(),
          targetUser: targetUser.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Research could not be completed."
        );
      }

      setReport(data.report);

      await saveResearch(data.report);

      setQuery("");
      setGeographicMarket("");
      setTargetUser("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Research error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete market research."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveResearch(researchReport: ResearchReport) {
    try {
      const response = await fetch("/api/research/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report: researchReport,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save research.");
      }

      await loadHistory();
    } catch (error) {
      console.error("Research save error:", error);
    }
  }

  async function openHistory(item: HistoryItem) {
    try {
      setErrorMessage("");

      const response = await fetch(
        `/api/research/history/${item.id}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error || "Unable to open research."
        );
      }

      const data = await response.json();

      if (data.report) {
        setReport(data.report);
        setCompetitorSearch("");

        // Close drawer on mobile after selecting history.
        if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        }

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } catch (error) {
      console.error("Open research error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to open this research report."
      );
    }
  }

  async function deleteResearch(researchId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this research report?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/research/history/${researchId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Failed to delete research."
        );
      }

      setHistory((currentHistory) =>
        currentHistory.filter(
          (item) => item.id !== researchId
        )
      );
    } catch (error) {
      console.error("Delete research error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete research."
      );
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    router.push("/login");
    router.refresh();
  }

  /*
   * Theme
   *
   * Saves the selected theme through the cookie API.
   * No localStorage is used.
   */
  async function toggleTheme() {
    const nextTheme = darkMode ? "light" : "dark";

    setDarkMode(nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;

    document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;

    try {
      const response = await fetch("/api/theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          theme: nextTheme,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save theme.");
      }
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }

  function handleSort(field: keyof Competitor) {
    if (sortField === field) {
      setSortAsc((current) => !current);
      return;
    }

    setSortField(field);
    setSortAsc(true);
  }

  function startNewResearch() {
    setReport(null);
    setErrorMessage("");
    setCompetitorSearch("");
    setQuery("");
    setGeographicMarket("");
    setTargetUser("");

    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function exportPDF() {
    const reportElement =
      document.getElementById("research-report");

    const reportHeader =
      document.getElementById(
        "research-report-header"
      );

    const reportContent =
      document.getElementById(
        "research-report-content"
      );

    if (!reportElement || !reportHeader || !reportContent || !report) {
      return;
    }

    const previousCompetitorSearch =
      competitorSearch;

    const waitForRender = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });

    const addCanvasToPdf = async (
      pdf: jsPDF,
      canvas: HTMLCanvasElement,
      state: { hasPage: boolean }
    ) => {
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth =
        pageWidth - margin * 2;
      const pageContentHeight =
        pageHeight - margin * 2;

      let sourceY = 0;

      while (sourceY < canvas.height) {
        if (state.hasPage) {
          pdf.addPage();
        }

        const remainingHeight =
          canvas.height - sourceY;

        const pagePixelHeight = Math.min(
          remainingHeight,
          Math.floor(
            (pageContentHeight / contentWidth) *
              canvas.width
          )
        );

        const pageCanvas =
          document.createElement("canvas");

        pageCanvas.width = canvas.width;
        pageCanvas.height = pagePixelHeight;

        const context =
          pageCanvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Unable to prepare PDF page."
          );
        }

        context.fillStyle = darkMode
          ? "#0d0f12"
          : "#ffffff";

        context.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        context.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          pagePixelHeight,
          0,
          0,
          canvas.width,
          pagePixelHeight
        );

        const pageImage =
          pageCanvas.toDataURL(
            "image/jpeg",
            0.92
          );

        const renderedHeight =
          (pagePixelHeight * contentWidth) /
          canvas.width;

        pdf.addImage(
          pageImage,
          "JPEG",
          margin,
          margin,
          contentWidth,
          renderedHeight
        );

        state.hasPage = true;
        sourceY += pagePixelHeight;
      }
    };

    try {
      setErrorMessage("");

      // Export should contain the complete competitor table,
      // not only the rows currently filtered in the UI.
      if (previousCompetitorSearch) {
        setCompetitorSearch("");
        await waitForRender();
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfState = {
        hasPage: false,
      };

      const canvasOptions = {
        scale: 2,
        useCORS: true,
        backgroundColor: darkMode
          ? "#0d0f12"
          : "#ffffff",
        logging: false,
        windowWidth:
          reportElement.scrollWidth,
      };

      // Export the report header once.
      const headerCanvas =
        await html2canvas(
          reportHeader,
          canvasOptions
        );

      await addCanvasToPdf(
        pdf,
        headerCanvas,
        pdfState
      );

      // Each report tab is rendered one after another so
      // the PDF contains every section, regardless of which
      // tab the user selected on screen.
      const tabButtons = Array.from(
        reportElement.querySelectorAll<HTMLButtonElement>(
          "[data-report-tab]"
        )
      );

      const currentTab = tabButtons.find(
        (button) =>
          button.getAttribute(
            "aria-pressed"
          ) === "true"
      );

      for (const button of tabButtons) {
        const sectionId =
          button.getAttribute(
            "data-report-tab"
          );

        if (!sectionId) {
          continue;
        }

        button.click();
        await waitForRender();

        if (
          sectionId === "trends" &&
          !report.marketOverview.trendAnalysis?.length
        ) {
          continue;
        }

        const sectionCanvas =
          await html2canvas(
            reportContent,
            canvasOptions
          );

        if (
          sectionCanvas.width === 0 ||
          sectionCanvas.height === 0
        ) {
          continue;
        }

        await addCanvasToPdf(
          pdf,
          sectionCanvas,
          pdfState
        );
      }

      // Restore the tab the user was viewing before export.
      currentTab?.click();

      // Restore the competitor search filter after export.
      if (previousCompetitorSearch) {
        setCompetitorSearch(
          previousCompetitorSearch
        );
      }

      const fileName =
        `${report.title || "market-research-report"}`
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase() ||
        "market-research-report";

      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error(
        "PDF export failed:",
        error
      );

      setErrorMessage(
        "Unable to export the complete research report as PDF. Please try again."
      );

      if (previousCompetitorSearch) {
        setCompetitorSearch(
          previousCompetitorSearch
        );
      }
    }
  }

  const filteredHistory = history.filter((item) => {
    const value =
      `${item.title} ${item.query}`.toLowerCase();

    return value.includes(
      searchQuery.toLowerCase()
    );
  });

  const filteredCompetitors = useMemo(() => {
    if (!report) {
      return [];
    }

    const filtered = report.competitors.filter(
      (competitor) => {
        const value = [
          competitor.name,
          competitor.description,
          competitor.targetUser,
          competitor.pricingModel,
          competitor.fundingStatus,
          competitor.keyFeatures?.join(" "),
        ]
          .join(" ")
          .toLowerCase();

        return value.includes(
          competitorSearch.toLowerCase()
        );
      }
    );

    return [...filtered].sort((a, b) => {
      const first = String(
        a[sortField] || ""
      ).toLowerCase();

      const second = String(
        b[sortField] || ""
      ).toLowerCase();

      return sortAsc
        ? first.localeCompare(second)
        : second.localeCompare(first);
    });
  }, [
    report,
    competitorSearch,
    sortField,
    sortAsc,
  ]);

  const pageClass = darkMode
    ? "bg-[#0d0f12] text-white"
    : "bg-[#f5f7fa] text-[#111827]";

  return (
    <main
      className={`min-h-screen w-full overflow-x-hidden ${pageClass}`}
    >
      <div className="flex min-h-screen">
        {/*
         * Mobile backdrop.
         * Only appears below lg breakpoint.
         */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}

        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          darkMode={darkMode}
          userEmail={userEmail}
          historyLoading={historyLoading}
          filteredHistory={filteredHistory}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showAccountMenu={showAccountMenu}
          setShowAccountMenu={setShowAccountMenu}
          setShowSettings={setShowSettings}
          openHistory={openHistory}
          deleteResearch={deleteResearch}
          onNewResearch={startNewResearch}
          handleLogout={handleLogout}
        />

        {/*
         * Main content.
         *
         * On mobile:
         *   ml-0
         *
         * On desktop:
         *   sidebar open -> ml-[270px]
         *   sidebar closed -> ml-0
         */}
        <section
          className={`min-w-0 flex min-h-screen w-full flex-1 flex-col transition-all duration-300 ${
            sidebarOpen
              ? "ml-0 lg:ml-[270px]"
              : "ml-0"
          }`}
        >
          <header
            className={`fixed right-0 top-0 z-40 flex h-16 items-center justify-between border-b px-3 backdrop-blur-xl transition-all duration-300 sm:h-[68px] sm:px-6 lg:px-7 ${
              sidebarOpen
                ? "left-0 lg:left-[270px]"
                : "left-0"
            } ${
              darkMode
                ? "border-white/10 bg-[#0d0f12]/95"
                : "border-gray-200 bg-white/95"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    darkMode
                      ? "hover:bg-white/5"
                      : "hover:bg-gray-100"
                  }`}
                  aria-label="Open sidebar"
                >
                  ☰
                </button>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {report
                    ? report.title
                    : "New Market Research"}
                </p>

                {report && (
                  <p className="hidden truncate text-xs text-gray-500 sm:block">
                    AI competitive intelligence report
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {report && (
                <button
                  type="button"
                  onClick={exportPDF}
                  className={`hidden rounded-lg border px-3 py-2 text-xs font-medium sm:block ${
                    darkMode
                      ? "border-white/10 hover:bg-white/5"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Export PDF
                </button>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  darkMode
                    ? "bg-white/10"
                    : "bg-gray-200"
                }`}
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {darkMode ? "☀" : "☾"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowAccountMenu(
                    (current) => !current
                  )
                }
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  darkMode
                    ? "bg-white text-black"
                    : "bg-black text-white"
                }`}
                aria-label="Account menu"
              >
                {userEmail
                  ? userEmail
                      .charAt(0)
                      .toUpperCase()
                  : "U"}
              </button>
            </div>
          </header>

          <div className="min-w-0 flex-1 overflow-y-auto pt-16 sm:pt-[68px]">
            {!report ? (
              <ResearchForm
                query={query}
                setQuery={setQuery}
                geographicMarket={
                  geographicMarket
                }
                setGeographicMarket={
                  setGeographicMarket
                }
                targetUser={targetUser}
                setTargetUser={setTargetUser}
                loading={loading}
                errorMessage={errorMessage}
                onSubmit={handleResearch}
                darkMode={darkMode}
              />
            ) : (
              <ResearchReportView
                report={report}
                competitors={filteredCompetitors}
                competitorSearch={
                  competitorSearch
                }
                setCompetitorSearch={
                  setCompetitorSearch
                }
                onSort={handleSort}
                onNewResearch={
                  startNewResearch
                }
                onExportPDF={exportPDF}
                darkMode={darkMode}
              />
            )}
          </div>
        </section>

        {showSettings && (
          <SettingsModal
            userEmail={userEmail}
            darkMode={darkMode}
            setShowSettings={setShowSettings}
            handleLogout={handleLogout}
            onToggleTheme={toggleTheme}
          />
        )}
      </div>
    </main>
  );
}

function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  darkMode,
  userEmail,
  historyLoading,
  filteredHistory,
  searchOpen,
  setSearchOpen,
  searchQuery,
  setSearchQuery,
  showAccountMenu,
  setShowAccountMenu,
  setShowSettings,
  openHistory,
  deleteResearch,
  onNewResearch,
  handleLogout,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  darkMode: boolean;
  userEmail: string;
  historyLoading: boolean;
  filteredHistory: HistoryItem[];
  searchOpen: boolean;
  setSearchOpen: (value: boolean) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showAccountMenu: boolean;
  setShowAccountMenu: (value: boolean) => void;
  setShowSettings: (value: boolean) => void;
  openHistory: (item: HistoryItem) => void;
  deleteResearch: (id: string) => void;
  onNewResearch: () => void;
  handleLogout: () => void;
}) {
  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-[270px] max-w-[85vw] flex-col border-r transition-transform duration-300 ${
        sidebarOpen
          ? "translate-x-0"
          : "-translate-x-full"
      } ${
        darkMode
          ? "border-white/10 bg-[#111318]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
              darkMode
                ? "bg-white text-black"
                : "bg-black text-white"
            }`}
          >
            ◈
          </div>

          <div className="min-w-0">
            <h1 className="text-base font-bold">
              MarketResearch AI
            </h1>

            <p className="text-[11px] text-gray-500">
              Competitive Intelligence
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className={`ml-auto shrink-0 text-xl text-gray-500 ${
              darkMode
                ? "hover:text-white"
                : "hover:text-gray-900"
            }`}
            aria-label="Close sidebar"
          >
            ‹
          </button>
        </div>
      </div>

      <div className="px-4">
        <button
          type="button"
          onClick={onNewResearch}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
            darkMode
              ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span className="text-lg">+</span>
          New Research
        </button>
      </div>

      <div className="px-4 pt-5">
        {searchOpen ? (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
              darkMode
                ? "border-white/10 bg-white/[0.04]"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <span className="text-gray-500">
              ⌕
            </span>

            <input
              autoFocus
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search research..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />

            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="text-xs text-gray-500"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              darkMode
                ? "text-gray-400 hover:bg-white/5"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            ⌕ Search research
          </button>
        )}
      </div>

      <div className="mt-6 flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-3 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Research History
          </p>

          <span className="text-[10px] text-gray-600">
            {filteredHistory.length}
          </span>
        </div>

        {historyLoading ? (
          <p className="px-3 py-3 text-xs text-gray-500">
            Loading research...
          </p>
        ) : filteredHistory.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-500">
              ◌
            </div>

            <p className="mt-3 text-xs text-gray-500">
              No research yet
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className={`group flex items-center rounded-lg ${
                  darkMode
                    ? "hover:bg-white/[0.04]"
                    : "hover:bg-gray-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    openHistory(item)
                  }
                  className="min-w-0 flex-1 px-3 py-3 text-left"
                >
                  <p
                    className={`truncate text-sm ${
                      darkMode
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {item.title ||
                      item.query ||
                      "Untitled Research"}
                  </p>

                  <p className="mt-1 truncate text-[11px] text-gray-600">
                    {item.query}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteResearch(item.id)
                  }
                  className="mr-2 hidden h-7 w-7 rounded-md text-xs text-gray-600 hover:bg-red-500/10 hover:text-red-400 group-hover:block"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`relative border-t p-3 ${
          darkMode
            ? "border-white/10"
            : "border-gray-200"
        }`}
      >
        <button
          type="button"
          onClick={() =>
            setShowAccountMenu(
              !showAccountMenu
            )
          }
          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${
            darkMode
              ? "hover:bg-white/[0.04]"
              : "hover:bg-gray-100"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
            {userEmail
              ? userEmail
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {userEmail
                ? userEmail.split("@")[0]
                : "Account"}
            </p>

            <p className="truncate text-[11px] text-gray-500">
              {userEmail || "Signed in"}
            </p>
          </div>

          <span className="text-gray-500">
            •••
          </span>
        </button>

        {showAccountMenu && (
          <div
            className={`absolute bottom-16 left-3 right-3 z-50 rounded-xl border p-2 shadow-2xl ${
              darkMode
                ? "border-white/10 bg-[#20232a]"
                : "border-gray-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setShowSettings(true)
              }
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                darkMode
                  ? "hover:bg-white/5"
                  : "hover:bg-gray-100"
              }`}
            >
              Settings
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function ResearchForm({
  query,
  setQuery,
  geographicMarket,
  setGeographicMarket,
  targetUser,
  setTargetUser,
  loading,
  errorMessage,
  onSubmit,
  darkMode,
}: {
  query: string;
  setQuery: (value: string) => void;
  geographicMarket: string;
  setGeographicMarket: (value: string) => void;
  targetUser: string;
  setTargetUser: (value: string) => void;
  loading: boolean;
  errorMessage: string;
  onSubmit: (event: FormEvent) => void;
  darkMode: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14 md:px-10 md:pb-32">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          AI Market Intelligence
        </div>

        <h2 className="mt-7 text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
          Research the market
          <br />
          <span className="text-gray-500">
            before you build.
          </span>
        </h2>

        <p
          className={`mx-auto mt-5 max-w-2xl text-sm leading-7 sm:mt-6 sm:text-base ${
            darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        >
          Analyze competitors, pricing, market gaps,
          trends and SWOT insights using live web
          research with source-backed evidence.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className={`mx-auto mt-8 max-w-4xl rounded-3xl border p-2 shadow-2xl sm:mt-12 ${
          darkMode
            ? "border-white/10 bg-[#15181d]"
            : "border-gray-200 bg-white"
        }`}
      >
        <div
          className={`rounded-2xl p-4 sm:p-6 ${
            darkMode
              ? "bg-[#101216]"
              : "bg-gray-50"
          }`}
        >
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
            Product idea or industry
          </label>

          <textarea
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Example: AI-powered project management platform for remote teams"
            rows={5}
            className={`mt-3 w-full resize-none bg-transparent text-base leading-7 outline-none sm:text-lg ${
              darkMode
                ? "placeholder:text-gray-700"
                : "placeholder:text-gray-400"
            }`}
          />
        </div>

        <div className="grid gap-3 p-3 md:grid-cols-2">
          <InputField
            label="Geographic market"
            optional
            value={geographicMarket}
            onChange={setGeographicMarket}
            placeholder="India, USA, Europe..."
            darkMode={darkMode}
          />

          <InputField
            label="Target user"
            optional
            value={targetUser}
            onChange={setTargetUser}
            placeholder="Startup founders, students..."
            darkMode={darkMode}
          />
        </div>

        {errorMessage && (
          <div className="mx-3 mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="mx-3 mb-3 flex w-[calc(100%-24px)] items-center justify-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-bold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-black" />
              Researching market...
            </>
          ) : (
            <>
              Analyze Market
              <span>→</span>
            </>
          )}
        </button>
      </form>

      {loading && (
        <ResearchProgress darkMode={darkMode} />
      )}

      {!loading && (
        <div className="mx-auto mt-8 grid max-w-4xl gap-3 md:grid-cols-3">
          <FeatureCard
            number="01"
            title="Competitor Intelligence"
            text="Find relevant companies, alternatives and market leaders."
            darkMode={darkMode}
          />

          <FeatureCard
            number="02"
            title="Market Opportunities"
            text="Identify underserved users, gaps and unmet needs."
            darkMode={darkMode}
          />

          <FeatureCard
            number="03"
            title="Evidence-backed SWOT"
            text="Turn the competitive landscape into structured insights."
            darkMode={darkMode}
          />
        </div>
      )}
    </div>
  );
}

function ResearchProgress({
  darkMode,
}: {
  darkMode: boolean;
}) {
  const steps = [
    "Generating research queries",
    "Searching web sources",
    "Analyzing competitors",
    "Building evidence-backed report",
  ];

  return (
    <div
      className={`mx-auto mt-8 max-w-4xl rounded-2xl border p-4 sm:p-6 ${
        darkMode
          ? "border-white/10 bg-[#15181d]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-600 border-t-white" />

        <div className="min-w-0">
          <p className="text-sm font-semibold">
            Building your market report
          </p>

          <p className="mt-1 text-xs text-gray-500">
            This may take a moment while live sources are analyzed.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-2 md:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`rounded-xl border p-3 ${
              darkMode
                ? "border-white/5 bg-white/[0.02]"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            <span className="text-[10px] font-bold text-blue-400">
              0{index + 1}
            </span>

            <p className="mt-2 text-xs text-gray-500">
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchReportView({
  report,
  competitors,
  competitorSearch,
  setCompetitorSearch,
  onSort,
  onNewResearch,
  onExportPDF,
  darkMode,
}: {
  report: ResearchReport;
  competitors: Competitor[];
  competitorSearch: string;
  setCompetitorSearch: (value: string) => void;
  onSort: (field: keyof Competitor) => void;
  onNewResearch: () => void;
  onExportPDF: () => void;
  darkMode: boolean;
}) {
  const [activeSection, setActiveSection] =
    useState("overview");

  const cardClass = darkMode
    ? "border-white/10 bg-[#15181d]"
    : "border-gray-200 bg-white";

  const mutedClass = darkMode
    ? "text-gray-400"
    : "text-gray-600";

  const totalSources =
    report.sources?.length || 0;

  const totalFeatures =
    report.competitors.reduce(
      (sum, competitor) =>
        sum +
        (competitor.keyFeatures?.length || 0),
      0
    );

  const tabs = [
    {
      id: "overview",
      label: "Market Overview",
    },
    {
      id: "competitors",
      label: "Competitors",
    },
    {
      id: "pricing",
      label: "Pricing",
    },
    {
      id: "trends",
      label: "Trends",
    },
    {
      id: "gaps",
      label: "Gaps",
    },
    {
      id: "swot",
      label: "SWOT",
    },
    {
      id: "sources",
      label: "Sources",
    },
  ];

  return (
    <div
      id="research-report"
      className="mx-auto w-full max-w-7xl min-w-0 overflow-hidden px-3 pb-24 pt-5 sm:px-5 sm:pt-8 md:px-8 md:pb-32"
    >
      <div
        id="research-report-header"
        className="rounded-3xl border border-blue-500/10 bg-gradient-to-br from-blue-500/[0.08] via-transparent to-transparent p-5 sm:p-6 md:p-8"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="min-w-0 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">
                Research Report
              </span>

              <span className="text-xs text-gray-500">
                Evidence-backed analysis
              </span>
            </div>

            <h1 className="mt-4 break-words text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {report.title}
            </h1>

            <p
              className={`mt-4 max-w-4xl break-words text-sm leading-7 ${mutedClass}`}
            >
              {report.query}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={onExportPDF}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-gray-200"
            >
              Export PDF
            </button>

            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={onNewResearch}
              className={`rounded-xl border px-4 py-2.5 text-sm ${
                darkMode
                  ? "border-white/10 hover:bg-white/5"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              + New Research
            </button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            value={String(
              report.competitors.length
            )}
            label="Competitors"
          />

          <MetricCard
            value={String(
              report.marketGaps.length
            )}
            label="Market gaps"
          />

          <MetricCard
            value={String(totalSources)}
            label="Sources"
          />

          <MetricCard
            value={String(totalFeatures)}
            label="Features analyzed"
          />
        </div>
      </div>

      <div
        className={`sticky top-16 z-30 mt-4 rounded-2xl border p-2 backdrop-blur-xl sm:top-[68px] sm:mt-6 ${
          darkMode
            ? "border-white/10 bg-[#111318]/95"
            : "border-gray-200 bg-white/95"
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-report-tab={tab.id}
              aria-pressed={
                activeSection === tab.id
              }
              onClick={() =>
                setActiveSection(tab.id)
              }
              className={`shrink-0 rounded-xl px-3 py-2.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                activeSection === tab.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : darkMode
                    ? "text-gray-400 hover:bg-white/5 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        id="research-report-content"
        className="mt-8"
      >
        {activeSection === "overview" && (
          <section>
            <SectionTitle
              title="Market Overview"
              description="Executive view of the market, target audience and current signals."
            />

            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard
                title="Industry"
                value={
                  report.marketOverview
                    .industry
                }
                icon="◈"
                darkMode={darkMode}
              />

              <InfoCard
                title="Target Market"
                value={
                  report.marketOverview
                    .targetMarket
                }
                icon="◎"
                darkMode={darkMode}
              />

              <InfoCard
                title="Geographic Market"
                value={
                  report.marketOverview
                    .geographicMarket ||
                  "Not specified"
                }
                icon="⌖"
                darkMode={darkMode}
              />
            </div>

            <div
              className={`mt-3 rounded-2xl border p-5 sm:p-6 ${cardClass}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-400">
                  ✦
                </span>

                <h3 className="font-semibold">
                  Executive Summary
                </h3>
              </div>

              <p
                className={`mt-4 max-w-5xl break-words text-sm leading-7 ${mutedClass}`}
              >
                {
                  report.marketOverview
                    .summary
                }
              </p>

              {report.marketOverview.trends
                ?.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Key signals
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.marketOverview.trends.map(
                      (trend, index) => (
                        <span
                          key={index}
                          className={`rounded-lg border px-3 py-2 text-xs ${
                            darkMode
                              ? "border-white/10 bg-white/[0.03]"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          {trend}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "competitors" && (
          <section>
            <SectionTitle
              title="Competitor Landscape"
              description="Sortable and filterable comparison of researched competitors."
            />

            <div className="mb-4 flex flex-col gap-3 md:flex-row">
              <div
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-4 py-3 ${cardClass}`}
              >
                <span className="text-gray-500">
                  ⌕
                </span>

                <input
                  value={competitorSearch}
                  onChange={(event) =>
                    setCompetitorSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search competitors, features, users..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>

              <div
                className={`flex min-h-12 items-center justify-center rounded-xl border px-4 text-xs ${cardClass}`}
              >
                {competitors.length} results
              </div>
            </div>

            <div
              className={`overflow-hidden rounded-2xl border ${cardClass}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead
                    className={
                      darkMode
                        ? "bg-white/[0.035]"
                        : "bg-gray-50"
                    }
                  >
                    <tr>
                      <TableHeader
                        label="Company"
                        onClick={() =>
                          onSort("name")
                        }
                      />

                      <TableHeader
                        label="Target User"
                        onClick={() =>
                          onSort("targetUser")
                        }
                      />

                      <TableHeader
                        label="Pricing"
                        onClick={() =>
                          onSort(
                            "pricingModel"
                          )
                        }
                      />

                      <th className="px-5 py-4 font-medium text-gray-500">
                        Key Features
                      </th>

                      <TableHeader
                        label="Funding"
                        onClick={() =>
                          onSort(
                            "fundingStatus"
                          )
                        }
                      />

                      <th className="px-5 py-4 font-medium text-gray-500">
                        Evidence
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {competitors.map(
                      (competitor, index) => (
                        <tr
                          key={`${competitor.name}-${index}`}
                          className={`border-t transition ${
                            darkMode
                              ? "border-white/5 hover:bg-white/[0.025]"
                              : "border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-5 py-5 align-top">
                            <p className="font-semibold">
                              {competitor.name}
                            </p>

                            {competitor.website ? (
                              <a
                                href={
                                  competitor.website
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 block max-w-[230px] truncate text-xs text-blue-400 hover:underline"
                              >
                                {
                                  competitor.website
                                }
                              </a>
                            ) : (
                              <span className="mt-1 block text-xs text-gray-600">
                                Website not verified
                              </span>
                            )}
                          </td>

                          <td
                            className={`max-w-[190px] px-5 py-5 align-top ${mutedClass}`}
                          >
                            {
                              competitor.targetUser
                            }
                          </td>

                          <td
                            className={`max-w-[190px] px-5 py-5 align-top ${mutedClass}`}
                          >
                            {
                              competitor.pricingModel
                            }
                          </td>

                          <td className="px-5 py-5 align-top">
                            <div className="flex max-w-[280px] flex-wrap gap-1.5">
                              {competitor.keyFeatures
                                ?.slice(0, 4)
                                .map(
                                  (
                                    feature,
                                    featureIndex
                                  ) => (
                                    <span
                                      key={
                                        featureIndex
                                      }
                                      className={`rounded-md px-2 py-1 text-[11px] ${
                                        darkMode
                                          ? "bg-white/5 text-gray-300"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {feature}
                                    </span>
                                  )
                                )}
                            </div>
                          </td>

                          <td
                            className={`max-w-[180px] px-5 py-5 align-top ${mutedClass}`}
                          >
                            {
                              competitor.fundingStatus
                            }
                          </td>

                          <td className="px-5 py-5 align-top">
                            {competitor
                              .sources?.[0] && (
                              <a
                                href={
                                  competitor
                                    .sources[0]
                                    .url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20"
                              >
                                Verify →
                              </a>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeSection === "pricing" && (
          <section>
            <PricingSection
              report={report}
              darkMode={darkMode}
            />

            <PositioningSection
              report={report}
              darkMode={darkMode}
            />
          </section>
        )}

        {activeSection === "trends" && (
          <section>
            <TrendSection
              report={report}
              darkMode={darkMode}
            />
          </section>
        )}

        {activeSection === "gaps" && (
          <section>
            <SectionTitle
              title="Market Gaps"
              description="Potential underserved needs identified from the competitive landscape."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {report.marketGaps.map(
                (gap, index) => (
                  <div
                    key={gap.id || index}
                    className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 sm:p-6 ${cardClass}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        Gap{" "}
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <span className="text-gray-700">
                        ↗
                      </span>
                    </div>

                    <h3 className="mt-5 break-words text-lg font-semibold">
                      {gap.gap}
                    </h3>

                    <p
                      className={`mt-3 break-words text-sm leading-6 ${mutedClass}`}
                    >
                      {gap.description}
                    </p>

                    <div className="mt-6 grid gap-4">
                      <MiniInsight
                        label="Why it matters"
                        value={gap.whyMatters}
                        darkMode={darkMode}
                      />

                      <MiniInsight
                        label="Who needs it"
                        value={gap.whoNeeds}
                        darkMode={darkMode}
                      />
                    </div>

                    <SourceLinks
                      sources={gap.sources}
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {activeSection === "swot" && (
          <section>
            <SectionTitle
              title="SWOT Analysis"
              description="Structured strategic analysis based on the researched competitive landscape."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <SwotCard
                title="Strengths"
                label="S"
                items={report.swot.strengths}
                darkMode={darkMode}
              />

              <SwotCard
                title="Weaknesses"
                label="W"
                items={report.swot.weaknesses}
                darkMode={darkMode}
              />

              <SwotCard
                title="Opportunities"
                label="O"
                items={
                  report.swot.opportunities
                }
                darkMode={darkMode}
              />

              <SwotCard
                title="Threats"
                label="T"
                items={report.swot.threats}
                darkMode={darkMode}
              />
            </div>
          </section>
        )}

        {activeSection === "sources" && (
          <section>
            <SectionTitle
              title="Sources & Evidence"
              description={`${totalSources} web sources were supplied to the research pipeline.`}
            />

            <div className="grid gap-4 md:grid-cols-2">
              {report.sources.map(
                (source, index) => (
                  <SourceCard
                    key={`${source.id || "source"}-${index}`}
                    source={source}
                    index={index}
                    darkMode={darkMode}
                  />
                )
              )}
            </div>
          </section>
        )}
      </div>

      <div className="mt-12 border-t border-white/10 pt-8 text-center">
        <p className="text-xs text-gray-600">
          MarketResearch AI · Research generated
          from supplied web evidence
        </p>
      </div>
    </div>
  );
}

function PricingSection({
  report,
  darkMode,
}: {
  report: ResearchReport;
  darkMode: boolean;
}) {
  const competitorsWithPricing =
    report.competitors.filter(
      (competitor) =>
        competitor.pricingTiers?.length > 0
    );

  if (competitorsWithPricing.length === 0) {
    return (
      <section className="mt-10">
        <SectionTitle
          title="Pricing Intelligence"
          description="Explicit competitor pricing extracted from available research."
        />

        <EmptyEvidence
          text="No verified pricing tiers were found in the available research."
          darkMode={darkMode}
        />
      </section>
    );
  }

  return (
    <section className="mt-10">
      <SectionTitle
        title="Pricing Intelligence"
        description="Only pricing explicitly supported by the available research is shown."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {competitorsWithPricing.map(
          (competitor) => (
            <div
              key={competitor.name}
              className={`overflow-hidden rounded-2xl border ${
                darkMode
                  ? "border-white/10 bg-[#15181d]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="border-b border-white/5 px-5 py-4">
                <p className="font-semibold">
                  {competitor.name}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {competitor.pricingModel}
                </p>
              </div>

              <div className="divide-y divide-white/5">
                {competitor.pricingTiers.map(
                  (tier, index) => (
                    <div
                      key={`${tier.name}-${index}`}
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {tier.name}
                          </p>

                          <p className="mt-2 text-xl font-bold">
                            {tier.price}
                          </p>
                        </div>

                        {tier.billingPeriod && (
                          <span className="text-xs text-gray-500">
                            {
                              tier.billingPeriod
                            }
                          </span>
                        )}
                      </div>

                      {tier.features?.length >
                        0 && (
                        <ul className="mt-4 space-y-2">
                          {tier.features
                            .slice(0, 5)
                            .map(
                              (
                                feature,
                                featureIndex
                              ) => (
                                <li
                                  key={
                                    featureIndex
                                  }
                                  className="flex gap-2 text-xs text-gray-500"
                                >
                                  <span className="text-blue-400">
                                    ✓
                                  </span>

                                  {feature}
                                </li>
                              )
                            )}
                        </ul>
                      )}

                      <SourceLinks
                        sources={tier.sources}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function TrendSection({
  report,
  darkMode,
}: {
  report: ResearchReport;
  darkMode: boolean;
}) {
  const trends =
    report.marketOverview.trendAnalysis || [];

  if (trends.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <SectionTitle
        title="Trend Analysis"
        description="Current and emerging developments supported by the available research."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {trends.map((trend, index) => (
          <div
            key={`${trend.title}-${index}`}
            className={`rounded-2xl border p-5 ${
              darkMode
                ? "border-white/10 bg-[#15181d]"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-blue-400">
                TREND{" "}
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </span>

              <TrendBadge
                direction={trend.direction}
              />
            </div>

            <h3 className="mt-4 font-semibold">
              {trend.title}
            </h3>

            <p className="mt-3 break-words text-sm leading-6 text-gray-500">
              {trend.summary}
            </p>

            <SourceLinks
              sources={trend.sources}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function PositioningSection({
  report,
  darkMode,
}: {
  report: ResearchReport;
  darkMode: boolean;
}) {
  const points = (
    report.positioning || []
  ).filter(
    (point) =>
      point.startingPrice !== null &&
      Number.isFinite(point.startingPrice)
  );

  if (points.length === 0) {
    return null;
  }

  const maxPrice = Math.max(
    ...points.map(
      (point) => point.startingPrice || 0
    ),
    1
  );

  const maxFeatures = Math.max(
    ...points.map(
      (point) => point.featureCount
    ),
    1
  );

  return (
    <section className="mt-10">
      <SectionTitle
        title="Competitive Positioning Map"
        description="Verified starting price plotted against feature breadth."
      />

      <div
        className={`rounded-2xl border p-4 sm:p-6 ${
          darkMode
            ? "border-white/10 bg-[#15181d]"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="mb-6 flex flex-wrap items-center gap-5 text-xs text-gray-500">
          <span>
            <strong className="text-gray-300">
              X
            </strong>{" "}
            Starting Price
          </span>

          <span>
            <strong className="text-gray-300">
              Y
            </strong>{" "}
            Feature Breadth
          </span>

          <span>
            {points.length} competitors with
            verified numeric pricing
          </span>
        </div>

        <div className="relative h-[320px] overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] sm:h-[420px]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:25%_25%]" />

          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
          <div className="absolute bottom-0 left-0 top-0 w-px bg-white/10" />

          {points.map((point) => {
            const x =
              ((point.startingPrice || 0) /
                maxPrice) *
                86 +
              6;

            const y =
              (point.featureCount /
                maxFeatures) *
                80 +
              7;

            return (
              <div
                key={point.competitor}
                className="absolute"
                style={{
                  left: `${Math.min(x, 92)}%`,
                  bottom: `${Math.min(y, 88)}%`,
                }}
              >
                <div className="group relative">
                  <div className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.65)]" />

                  <div className="absolute bottom-5 left-1/2 hidden w-48 -translate-x-1/2 rounded-lg border border-white/10 bg-[#20232a] p-3 shadow-xl group-hover:block">
                    <p className="text-xs font-semibold text-white">
                      {point.competitor}
                    </p>

                    <p className="mt-1 text-[11px] text-gray-400">
                      {point.currency || ""}
                      {point.startingPrice}
                      {" · "}
                      {point.featureCount}{" "}
                      features
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <span className="absolute bottom-3 right-4 text-[10px] text-gray-600">
            Higher price →
          </span>

          <span className="absolute left-3 top-3 text-[10px] text-gray-600">
            More features ↑
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {points.map((point) => (
            <span
              key={point.competitor}
              className="rounded-lg bg-white/[0.04] px-3 py-2 text-[11px] text-gray-400"
            >
              {point.competitor} ·{" "}
              {point.currency || ""}
              {point.startingPrice}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendBadge({
  direction,
}: {
  direction: string;
}) {
  const label =
    direction === "rising"
      ? "↑ Rising"
      : direction === "declining"
        ? "↓ Declining"
        : direction === "emerging"
          ? "✦ Emerging"
          : direction === "stable"
            ? "→ Stable"
            : "• Unknown";

  return (
    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-gray-400">
      {label}
    </span>
  );
}

function MetricCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-3 sm:p-4">
      <p className="text-xl font-bold sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-gray-500 sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}

function InputField({
  label,
  optional,
  value,
  onChange,
  placeholder,
  darkMode,
}: {
  label: string;
  optional?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        darkMode
          ? "border-white/10 bg-white/[0.02]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          {label}
        </label>

        {optional && (
          <span className="text-[9px] text-gray-600">
            OPTIONAL
          </span>
        )}
      </div>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent text-sm outline-none placeholder:text-gray-600"
      />
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold tracking-tight">
        {title}
      </h2>

      <p className="mt-1 break-words text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon,
  darkMode,
}: {
  title: string;
  value: string;
  icon: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        darkMode
          ? "border-white/10 bg-[#15181d]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          {title}
        </p>

        <span className="text-blue-400">
          {icon}
        </span>
      </div>

      <p className="mt-3 break-words text-sm font-medium leading-6">
        {value}
      </p>
    </div>
  );
}

function FeatureCard({
  number,
  title,
  text,
  darkMode,
}: {
  number: string;
  title: string;
  text: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        darkMode
          ? "border-white/10 bg-[#15181d]"
          : "border-gray-200 bg-white"
      }`}
    >
      <span className="text-[10px] font-bold tracking-[0.16em] text-blue-400">
        {number}
      </span>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {text}
      </p>
    </div>
  );
}

function TableHeader({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <th className="px-5 py-4 font-medium text-gray-500">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-blue-400"
      >
        {label}

        <span className="text-[10px]">
          ↕
        </span>
      </button>
    </th>
  );
}

function MiniInsight({
  label,
  value,
  darkMode,
}: {
  label: string;
  value: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 ${
        darkMode
          ? "bg-white/[0.03]"
          : "bg-gray-50"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm leading-6 text-gray-500">
        {value}
      </p>
    </div>
  );
}

function SwotCard({
  title,
  label,
  items,
  darkMode,
}: {
  title: string;
  label: string;
  items: SWOTPoint[];
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${
        darkMode
          ? "border-white/10 bg-[#15181d]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-bold text-blue-400">
          {label}
        </div>

        <h3 className="text-lg font-semibold">
          {title}
        </h3>
      </div>

      <div className="mt-6 space-y-5">
        {items?.map((item, index) => (
          <div
            key={index}
            className="border-l border-white/10 pl-4"
          >
            <p className="break-words text-sm leading-6">
              {item.text}
            </p>

            <SourceLinks
              sources={item.sources}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceLinks({
  sources,
}: {
  sources?: ResearchSource[];
}) {
  if (!sources?.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sources
        .slice(0, 3)
        .map((source, index) => (
          <a
            key={`${source.id || "source"}-${index}`}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-500/20"
          >
            [{index + 1}] Source ↗
          </a>
        ))}
    </div>
  );
}

function SourceCard({
  source,
  index,
  darkMode,
}: {
  source: ResearchSource;
  index: number;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 ${
        darkMode
          ? "border-white/10 bg-[#15181d]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-400">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="break-words text-sm font-semibold hover:text-blue-400 hover:underline"
          >
            {source.title}
          </a>

          <p className="mt-1 break-all text-[10px] text-gray-600">
            {source.domain || source.url}
          </p>

          {source.snippet && (
            <p className="mt-3 break-words text-sm leading-6 text-gray-500">
              {source.snippet}
            </p>
          )}
        </div>

        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="hidden shrink-0 text-xs text-blue-400 sm:block"
        >
          Open ↗
        </a>
      </div>
    </div>
  );
}

function EmptyEvidence({
  text,
  darkMode,
}: {
  text: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-8 text-center ${
        darkMode
          ? "border-white/10 bg-[#15181d]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-500">
        ∅
      </div>

      <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
        {text}
      </p>
    </div>
  );
}

function SettingsModal({
  userEmail,
  darkMode,
  setShowSettings,
  handleLogout,
  onToggleTheme,
}: {
  userEmail: string;
  darkMode: boolean;
  setShowSettings: (value: boolean) => void;
  handleLogout: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl sm:p-6 ${
          darkMode
            ? "border-white/10 bg-[#17191e]"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Settings
          </h2>

          <button
            type="button"
            onClick={() =>
              setShowSettings(false)
            }
            className="text-gray-500 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Account
            </p>

            <p className="mt-2 break-all text-sm">
              {userEmail}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Appearance
            </p>

            <button
              type="button"
              onClick={onToggleTheme}
              className={`mt-2 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                darkMode
                  ? "border-white/10"
                  : "border-gray-200"
              }`}
            >
              <span>
                {darkMode
                  ? "Dark mode"
                  : "Light mode"}
              </span>

              <span>
                {darkMode ? "☀" : "☾"}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}