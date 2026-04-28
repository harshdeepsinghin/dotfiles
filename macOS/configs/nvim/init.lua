-- =====================================
-- LEADER KEYS
-- =====================================
vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- =====================================
-- BASIC KEYMAPS
-- =====================================

-- Save file
vim.keymap.set("n", "<leader>w", "<cmd>w<CR>", { silent = true })

-- Quit current window
vim.keymap.set("n", "<leader>q", "<cmd>q<CR>", { silent = true })

-- Save + Quit
vim.keymap.set("n", "<leader>wq", "<cmd>wq<CR>", { silent = true })

-- Force Quit (without saving)
vim.keymap.set("n", "<leader>qq", "<cmd>q!<CR>", { silent = true })

-- Toggle Word Wrap
vim.keymap.set("n", "<leader>tw", "<cmd>set wrap!<CR>", { silent = true })

-- Clear Search Highlight
vim.keymap.set("n", "<leader>h", "<cmd>nohlsearch<CR>", { silent = true })

-- =====================================
-- MOVEMENT CUSTOMIZATION
-- j = up
-- k = down
-- =====================================
vim.keymap.set({ "n", "v", "o" }, "j", "k")
vim.keymap.set({ "n", "v", "o" }, "k", "j")

-- =====================================
-- UI / APPEARANCE
-- =====================================
vim.opt.number = true            -- line numbers
vim.opt.relativenumber = true    -- relative numbers
vim.opt.cursorline = true        -- highlight current line
vim.opt.signcolumn = "yes"       -- fixed gutter for signs/errors
vim.opt.termguicolors = true     -- full colors
vim.opt.wrap = true              -- word wrap enabled
vim.opt.scrolloff = 8            -- keep 8 lines padding while scrolling

-- =====================================
-- SEARCH SETTINGS
-- =====================================
vim.opt.ignorecase = true        -- case insensitive search
vim.opt.smartcase = true        -- uppercase makes search case sensitive

-- =====================================
-- INPUT / SYSTEM
-- =====================================
vim.opt.mouse = "a"              -- enable mouse
vim.opt.clipboard = "unnamedplus" -- use system clipboard

-- =====================================
-- INDENTATION
-- =====================================
vim.opt.tabstop = 4             -- tab width
vim.opt.shiftwidth = 4          -- indent width
vim.opt.expandtab = true        -- tabs become spaces
vim.opt.smartindent = true      -- smart auto indent

-- =====================================
-- QUALITY OF LIFE
-- =====================================
vim.opt.splitright = true       -- vertical split opens right
vim.opt.splitbelow = true       -- horizontal split opens below
vim.opt.updatetime = 250        -- faster updates
vim.opt.timeoutlen = 400        -- faster mapped sequence response
