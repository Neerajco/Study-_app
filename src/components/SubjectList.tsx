import React, { useState } from 'react';
import { BookOpen, Search, Code, Database, Cpu, Calculator, Network, Sparkles, Zap, Layers, TrendingUp, Wrench, ArrowRight } from 'lucide-react';
import { Subject } from '../types';

interface SubjectListProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: number) => void;
}

const getSubjectIcon = (iconName: string) => {
  switch (iconName) {
    case 'Code': return <Code className="w-5 h-5" />;
    case 'Database': return <Database className="w-5 h-5" />;
    case 'Cpu': return <Cpu className="w-5 h-5" />;
    case 'Calculator': return <Calculator className="w-5 h-5" />;
    case 'Network': return <Network className="w-5 h-5" />;
    case 'Sparkles': return <Sparkles className="w-5 h-5" />;
    case 'Zap': return <Zap className="w-5 h-5" />;
    case 'Layers': return <Layers className="w-5 h-5" />;
    case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
    case 'Wrench': return <Wrench className="w-5 h-5" />;
    default: return <BookOpen className="w-5 h-5" />;
  }
};

export const SubjectList: React.FC<SubjectListProps> = ({ subjects, onSelectSubject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(subjects.map((s) => s.category)))];

  const filteredSubjects = subjects.filter((sub) => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || sub.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="input-search-subjects"
            type="text"
            placeholder="Search subjects by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'All Branches' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((sub) => (
          <div
            key={sub.id}
            id={`subject-card-${sub.id}`}
            onClick={() => onSelectSubject(sub.id)}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {getSubjectIcon(sub.icon)}
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {sub.code || 'COURSE'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {sub.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{sub.category}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {sub.notes_count || 0} study notes available
              </span>
              <span className="text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800 mt-3">No Subjects Found</h4>
          <p className="text-xs text-slate-500 mt-1">Try another search query or select "All Branches".</p>
        </div>
      )}
    </div>
  );
};
