"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Copy, Check, Database, Sparkles, Zap, RefreshCw, Download, Code, Eye, EyeOff, Play, Cpu, Globe, Lock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function SQLGenerator() {
  const [tableName, setTableName] = useState("users");
  const [columnsText, setColumnsText] = useState("id:int:pk\nname:varchar(255)\nemail:varchar(255):unique\ncreated_at:timestamp");
  const [action, setAction] = useState("create");
  const [whereClause, setWhereClause] = useState("id = 1");
  const [limit, setLimit] = useState(100);
  const [sampleValuesText, setSampleValuesText] = useState("1|John Doe|john@example.com|now()\n2|Jane|jane@example.com|now()");
  const [copied, setCopied] = useState(false);
  const [hoverEffect, setHoverEffect] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [particles, setParticles] = useState<Array<{x: number, y: number, id: number}>>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth mouse following
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });
  
  // Calculate glow effect based on mouse position
  const glowX = useTransform(springX, (x) => `${x}px`);
  const glowY = useTransform(springY, (y) => `${y}px`);

  // Parse columns text into structured columns
  const columns = useMemo(() => {
    return columnsText
      .split(/\n|,/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const parts = line.split(":").map((p) => p.trim());
        return {
          id: index,
          name: parts[0] || "col",
          type: parts[1] || "varchar(255)",
          attrs: parts.slice(2),
          color: getColumnColor(parts[1] || "varchar"),
        };
      });
  }, [columnsText]);

  const sampleRows = useMemo(() => {
    return sampleValuesText
      .split(/\n/)
      .map((r) => r.split("|").map((c) => c.trim()));
  }, [sampleValuesText]);

  // Generate particles for cool effect
  useEffect(() => {
    if (hoverEffect && containerRef.current) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        id: Date.now() + i,
      }));
      setParticles(newParticles);
      
      const timer = setTimeout(() => setParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [hoverEffect]);

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    }
  };

  function getColumnColor(type: string) {
    if (type.includes('int') || type.includes('serial')) return '#3b82f6'; // blue
    if (type.includes('varchar') || type.includes('text')) return '#10b981'; // emerald
    if (type.includes('timestamp') || type.includes('date')) return '#f59e0b'; // amber
    if (type.includes('bool')) return '#8b5cf6'; // violet
    return '#6b7280'; // gray
  }

  function generateCreate() {
    const lines = columns.map((c) => {
      const attrText = c.attrs.join(" ");
      return `  ${c.name} ${c.type}${attrText ? " " + attrText : ""}`;
    });
    return `CREATE TABLE ${tableName} (\n${lines.join(',\n')}\n);`;
  }

  function generateSelect() {
    const cols = columns.map((c) => c.name).join(", ");
    const where = whereClause ? `\nWHERE ${whereClause}` : "";
    const limitText = limit ? `\nLIMIT ${limit}` : "";
    return `SELECT ${cols} FROM ${tableName}${where}${limitText};`;
  }

  function generateInsert() {
    const cols = columns.map((c) => c.name).join(", ");
    const valuesRow = sampleRows[0] || columns.map(() => "?");
    const values = valuesRow
      .slice(0, columns.length)
      .map((v) => (v.toLowerCase() === "now()" || v.toLowerCase() === "null" ? v : `'${v.replace(/'/g, "''")}'`))
      .join(", ");
    return `INSERT INTO ${tableName} (${cols}) VALUES (${values});`;
  }

  function generateUpdate() {
    const setParts = columns
      .filter((c) => c.name !== "id")
      .map((c, i) => `${c.name} = ${sampleRows[0] && sampleRows[0][i] ? `'${sampleRows[0][i].replace(/'/g, "''")}'` : "?"}`);
    const where = whereClause || "id = ?";
    return `UPDATE ${tableName} SET ${setParts.join(", ")} WHERE ${where};`;
  }

  function generateDelete() {
    const where = whereClause || "id = ?";
    return `DELETE FROM ${tableName} WHERE ${where};`;
  }

  const generated = useMemo(() => {
    switch (action) {
      case "create":
        return generateCreate();
      case "select":
        return generateSelect();
      case "insert":
        return generateInsert();
      case "update":
        return generateUpdate();
      case "delete":
        return generateDelete();
      default:
        return "-- choose an action";
    }
  }, [action, tableName, columns, whereClause, limit, sampleRows]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = generated;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  function exportSQL() {
    const blob = new Blob([generated], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_${action}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 text-gray-100 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-500" />
      </div>

      {/* Floating particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: particle.x + 'vw', 
              y: particle.y + 'vh',
              opacity: 1,
              scale: 1 
            }}
            animate={{ 
              x: particle.x + Math.random() * 100 + 'vw',
              y: particle.y - 100 + 'vh',
              opacity: 0,
              scale: 0 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              boxShadow: '0 0 20px #06b6d4, 0 0 40px #06b6d4',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Mouse glow effect */}
      <motion.div
        className="fixed w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl pointer-events-none"
        style={{
          x: glowX,
          y: glowY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setHoverEffect(true)}
          onMouseLeave={() => setHoverEffect(false)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl mx-auto bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden"
          style={{
            boxShadow: `
              0 0 60px rgba(6, 182, 212, 0.1),
              0 0 100px rgba(37, 99, 235, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
          }}
        >
          {/* Header with glowing effects */}
          <div className="p-8 border-b border-gray-800/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg"
                >
                  <Database className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <motion.h1 
                    className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    style={{ backgroundSize: '200% auto' }}
                  >
                    SQL Generator
                  </motion.h1>
                  <p className="text-gray-400 mt-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Generate SQL with cyberpunk style
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setTableName("users");
                    setColumnsText("id:int:pk\nname:varchar(255)\nemail:varchar(255):unique\ncreated_at:timestamp");
                    setSampleValuesText("1|John Doe|john@example.com|now()");
                    setAction("create");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50 text-gray-300 hover:text-white transition-all flex items-center gap-2 group"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                  Reset
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportSQL}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2 group"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
                <div className="text-cyan-400 text-sm flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Columns
                </div>
                <div className="text-2xl font-bold mt-2">{columns.length}</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
                <div className="text-blue-400 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Action
                </div>
                <div className="text-2xl font-bold mt-2 capitalize">{action}</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
                <div className="text-purple-400 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Table
                </div>
                <div className="text-2xl font-bold mt-2 font-mono">{tableName}</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
                <div className="text-emerald-400 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Rows
                </div>
                <div className="text-2xl font-bold mt-2">{sampleRows.length}</div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Panel - Inputs */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Table Name */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    Table Name
                  </label>
                  <input
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="w-full p-4 rounded-xl bg-gray-900/50 border border-gray-700 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all font-mono"
                    placeholder="Enter table name"
                  />
                </div>

                {/* Columns Editor */}
                <div className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Columns (name:type:attrs)
                    </label>
                    <span className="text-xs text-gray-500">One per line</span>
                  </div>
                  <textarea
                    value={columnsText}
                    onChange={(e) => setColumnsText(e.target.value)}
                    rows={6}
                    className="w-full p-4 rounded-xl bg-gray-900/50 border border-gray-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono resize-none"
                    spellCheck={false}
                  />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {columns.slice(0, 4).map((col) => (
                      <span
                        key={col.id}
                        className="px-3 py-1 rounded-lg text-xs font-mono border"
                        style={{
                          backgroundColor: `${col.color}15`,
                          borderColor: `${col.color}30`,
                          color: col.color,
                        }}
                      >
                        {col.name}: {col.type}
                      </span>
                    ))}
                    {columns.length > 4 && (
                      <span className="px-3 py-1 rounded-lg text-xs text-gray-400 border border-gray-700">
                        +{columns.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Sample Values */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    Sample Values (| separated)
                  </label>
                  <textarea
                    value={sampleValuesText}
                    onChange={(e) => setSampleValuesText(e.target.value)}
                    rows={4}
                    className="w-full p-4 rounded-xl bg-gray-900/50 border border-gray-700 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all font-mono resize-none"
                    spellCheck={false}
                  />
                </div>

                {/* Action & WHERE Controls */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Action Type</label>
                    <div className="relative">
                      <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="w-full p-4 rounded-xl bg-gray-900/50 border border-gray-700 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="create">CREATE TABLE</option>
                        <option value="select">SELECT</option>
                        <option value="insert">INSERT</option>
                        <option value="update">UPDATE</option>
                        <option value="delete">DELETE</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Limit</label>
                    <input
                      type="number"
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="w-full p-4 rounded-xl bg-gray-900/50 border border-gray-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      min="1"
                    />
                  </div>
                </div>

                {/* WHERE Clause */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    WHERE Clause
                  </label>
                  <input
                    value={whereClause}
                    onChange={(e) => setWhereClause(e.target.value)}
                    className="w-full p-4 rounded-xl bg-gray-900/50 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all font-mono"
                    placeholder="id = 1 OR status = 'active'"
                  />
                </div>
              </motion.div>

              {/* Right Panel - Generated SQL */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800/50 p-6 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      />
                      <h3 className="text-xl font-bold text-white">Generated SQL</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPreview(!showPreview)}
                        className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                        title={showPreview ? "Hide preview" : "Show preview"}
                      >
                        {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyToClipboard}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
                          copied 
                            ? "bg-emerald-600 text-white" 
                            : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25"
                        } transition-all`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            Copy SQL
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {showPreview ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 overflow-hidden"
                      >
                        <div className="relative">
                          {/* SQL Code Editor */}
                          <pre className="font-mono text-sm p-6 rounded-xl bg-black/50 border border-gray-800 overflow-x-auto h-[400px]">
                            <code className="text-gray-300">
                              {generated.split('\n').map((line, i) => (
                                <div key={i} className="flex items-start hover:bg-white/5 rounded px-2 py-1">
                                  <span className="text-gray-500 w-8 text-right mr-4 select-none">{i + 1}</span>
                                  <span className="flex-1">{highlightSQL(line)}</span>
                                </div>
                              ))}
                            </code>
                          </pre>
                          
                          {/* Floating execute button */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute bottom-4 right-4 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg flex items-center gap-2 group"
                          >
                            <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            Execute
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-center"
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                            <EyeOff className="w-8 h-8 text-gray-500" />
                          </div>
                          <p className="text-gray-500">Preview hidden</p>
                          <p className="text-sm text-gray-600 mt-1">Click the eye icon to show SQL</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick Action Buttons */}
                  <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
                    {['create', 'select', 'insert', 'update', 'delete'].map((act) => (
                      <motion.button
                        key={act}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAction(act)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          action === act
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                        }`}
                      >
                        {act}
                      </motion.button>
                    ))}
                  </div>

                  {/* Tips & Info */}
                  <motion.details 
                    className="mt-6 bg-gray-900/30 rounded-xl border border-gray-800/50 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <summary className="cursor-pointer p-4 text-gray-300 font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Tips & Information
                      </span>
                      <ChevronDown className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="p-4 pt-2 border-t border-gray-800/50">
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Use <code className="px-2 py-1 rounded bg-gray-800 text-cyan-300">name:type:attr</code> per line for columns</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Sample values should be pipe <code className="px-2 py-1 rounded bg-gray-800 text-blue-300">|</code> separated</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Single quotes are auto-escaped in sample values</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">•</span>
                          <span>Click Execute to run the query (simulated)</span>
                        </li>
                      </ul>
                    </div>
                  </motion.details>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-6 border-t border-gray-800/50 bg-black/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse" />
                  Built with cyberpunk vibes
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Adjust for your SQL dialect</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-gray-800 to-black border border-gray-700">
                  v2.0.1
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function highlightSQL(code: string): React.ReactNode {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'LIMIT'];
  const types = ['int', 'varchar', 'timestamp', 'bool', 'serial', 'text', 'date'];
  
  return code.split(/(\s+)/).map((word, i) => {
    const cleanWord = word.toUpperCase();
    if (keywords.includes(cleanWord)) {
      return <span key={i} className="text-cyan-400 font-bold">{word}</span>;
    }
    if (types.includes(word.toLowerCase())) {
      return <span key={i} className="text-emerald-400">{word}</span>;
    }
    if (word.includes('(') || word.includes(')') || word.includes(';')) {
      return <span key={i} className="text-gray-500">{word}</span>;
    }
    if (word.match(/^'[^']*'$/)) {
      return <span key={i} className="text-yellow-300">{word}</span>;
    }
    if (word.match(/^\d+$/)) {
      return <span key={i} className="text-purple-400">{word}</span>;
    }
    return <span key={i} className="text-gray-300">{word}</span>;
  });
}