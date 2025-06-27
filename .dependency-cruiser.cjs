/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "warn",
      comment: "Evita dipendenze circolari",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "not-to-unresolvable",
      comment: "Evita import non risolvibili",
      severity: "error",
      from: {
        pathNot: [
          "__tests__",
          "\\.spec\\.",
          "\\.test\\.",
          "/mocks/",
          "/stubs/",
        ],
      },
      to: {
        couldNotResolve: true,
      },
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment: "Evita import da devDependencies nei file non di test",
      from: {
        path: "^(src)",
        pathNot: [
          "__tests__",
          "\\.spec\\.",
          "\\.test\\.",
          "/mocks/",
          "/stubs/",
        ],
      },
      to: {
        dependencyTypes: ["npm-dev"],
        dependencyTypesNot: ["type-only"],
        pathNot: ["node_modules/@types/"],
      },
    },
  ],
  options: {
    // Solo dipendenze dirette
    maxDepth: 1,

    // Non seguire NESSUN file esterno
    doNotFollow: {
      path: ["node_modules/.*"],
    },

    // Escludi tutto il resto
    exclude: {
      path: [
        "node_modules",
        "node_modules/.*",
        "__tests__",
        "\\.spec\\.",
        "\\.test\\.",
        "/mocks/",
        "/stubs/",
        "globalMocks",
        "quasarStubs",
      ],
    },

    enhancedResolveOptions: {
      extensions: [".js", ".vue"],
      mainFields: ["module", "main", "types", "typings"],
    },

    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/(?:@[^/]+/[^/]+|[^/]+)",
        // Filtri per mostrare SOLO dipendenze interne
        filters: {
          includeOnly: {
            path: "^src/",
          },
          exclude: {
            path: ["node_modules", "node_modules/.*"],
          },
        },
        theme: {
          graph: {
            splines: "ortho",
            rankdir: "LR",
            bgcolor: "white",
            concentrate: true,
          },
          modules: [
            {
              criteria: { source: "^src/" },
              attributes: { fillcolor: "#42b883" },
            },
          ],
        },
      },
    },
  },
};
