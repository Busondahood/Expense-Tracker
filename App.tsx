<<<<<<< HEAD
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { TRANSLATIONS } from './types';
import { useExpenseTracker } from './hooks/useExpenseTracker';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { SlipModal } from './components/SlipModal';
import { AdminPanel } from './components/AdminPanel';
import { ReviewModal } from './components/ReviewModal';
import { Home, Settings as SettingsIcon, ChevronUp } from 'lucide-react';

const ConfigError = ({ t }: { t: typeof TRANSLATIONS['en'] }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D0D14] p-6 font-sans text-slate-900 dark:text-white">
    <div className="card-elevated p-8 rounded-3xl max-w-sm w-full text-center animate-enter-card border border-slate-100 dark:border-white/5">
      <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-scale-in">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-xl font-bold mb-3">{t.connectionRequired}</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
        {t.connectionDesc}
      </p>
    </div>
  </div>
);

function ExpenseTracker() {
  const tracker = useExpenseTracker();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D14] font-sans text-slate-900 dark:text-white transition-colors duration-500 ease-smooth pb-20 overflow-x-hidden">
      
      <Header 
        darkMode={tracker.darkMode}
        setDarkMode={tracker.setDarkMode}
        lang={tracker.lang}
        toggleLanguage={tracker.toggleLanguage}
        isSyncing={tracker.isSyncing}
        userName={tracker.userName}
        onSettingsClick={() => { tracker.saveSettingsNow(); tracker.setCurrentView('admin'); }}
        glowEnabled={tracker.glowEnabled}
      />

      {tracker.currentView === 'admin' ? (
        <div className="animate-enter-card">
          <AdminPanel 
            lang={tracker.lang}
            onBack={() => { tracker.saveSettingsNow(); tracker.setCurrentView('dashboard'); }}
            categories={tracker.categories}
            setCategories={tracker.setCategories}
            onClearData={tracker.handleClearAll}
            budgetSettings={tracker.budgetSettings}
            setBudgetSettings={tracker.setBudgetSettings}
            userName={tracker.userName}
            setUserName={tracker.setUserName}
            glowEnabled={tracker.glowEnabled}
            setGlowEnabled={tracker.setGlowEnabled}
            saveSettingsNow={tracker.saveSettingsNow}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6">
            <BalanceCard 
              stats={tracker.stats}
              budgetSettings={tracker.budgetSettings}
              budgetPercent={tracker.budgetPercent}
              glowEnabled={tracker.glowEnabled}
              t={tracker.t}
            />

            <TransactionForm 
              amount={tracker.amount}
              setAmount={tracker.setAmount}
              type={tracker.type}
              setType={tracker.setType}
              category={tracker.category}
              setCategory={tracker.setCategory}
              isCustomCategory={tracker.isCustomCategory}
              setIsCustomCategory={tracker.setIsCustomCategory}
              note={tracker.note}
              setNote={tracker.setNote}
              file={tracker.file}
              setFile={tracker.setFile}
              formErrors={tracker.formErrors}
              setFormErrors={tracker.setFormErrors}
              categories={tracker.categories}
              submitting={tracker.submitting}
              isScanning={tracker.isScanning}
              t={tracker.t}
              handleSubmit={tracker.handleSubmit}
              handleCategoryChange={tracker.handleCategoryChange}
              handleManualFileSelect={tracker.handleManualFileSelect}
              handleScanSlip={tracker.handleScanSlip}
              scanInputRef={tracker.scanInputRef}
              glowEnabled={tracker.glowEnabled}
            />

            <AnalyticsPanel 
              transactions={tracker.transactions}
              chartView={tracker.chartView}
              setChartView={tracker.setChartView}
              handleDownloadChart={tracker.handleDownloadChart}
              chartRef={tracker.chartRef}
              glowEnabled={tracker.glowEnabled}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5">
            <TransactionList 
              filteredTransactions={tracker.filteredTransactions}
              loading={tracker.loading}
              lang={tracker.lang}
              t={tracker.t}
              glowEnabled={tracker.glowEnabled}
              filterCategory={tracker.filterCategory}
              setFilterCategory={tracker.setFilterCategory}
              searchTerm={tracker.searchTerm}
              setSearchTerm={tracker.setSearchTerm}
              availableFilterCategories={tracker.availableFilterCategories}
              handleDelete={tracker.handleDelete}
              handleViewSlip={tracker.handleViewSlip}
              handleExportCSV={tracker.handleExportCSV}
              handleImportCSV={tracker.handleImportCSV}
              triggerImport={tracker.triggerImport}
              fetchTransactions={tracker.fetchTransactions}
              fileInputRef={tracker.fileInputRef}
            />
          </div>
        </div>
      )}

      <SlipModal isOpen={tracker.modalOpen} onClose={() => tracker.setModalOpen(false)} imageUrl={tracker.selectedSlip} />
      
      <ReviewModal 
        isOpen={tracker.isReviewModalOpen}
        onClose={() => {
          tracker.setIsReviewModalOpen(false);
          tracker.setPendingScans([]);
        }}
        pendingScans={tracker.pendingScans}
        setPendingScans={tracker.setPendingScans}
        categories={tracker.categories}
        lang={tracker.lang}
        onConfirmAll={tracker.handleConfirmScans}
        isConfirming={tracker.isConfirmingScans}
        glowEnabled={tracker.glowEnabled}
      />
      
      {/* Footer / Spacer for Bottom Nav on Mobile */}
      <div className="text-center py-8 mt-8 pb-24 md:pb-8">
        <p className="text-[11px] text-[#8E8E93] dark:text-[#EBEBF5]/60 font-medium tracking-wide">Credit by Bus ✨</p>
      </div>

      {/* iOS Style Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-t border-[#C6C6C8]/50 dark:border-[#38383A]/50 pb-safe">
        <div className="flex justify-around items-center px-2 py-2 h-16">
          <button 
            onClick={() => { tracker.saveSettingsNow(); tracker.setCurrentView('dashboard'); window.scrollTo({top: 0, behavior: 'smooth'}); }}
            className={`flex flex-col items-center justify-center w-20 space-y-1 transition-all active:scale-90 ${tracker.currentView === 'dashboard' ? 'text-ios-blue' : 'text-[#8E8E93] dark:text-[#EBEBF5]/60'}`}
          >
            <Home size={24} strokeWidth={tracker.currentView === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-none">Home</span>
          </button>
          
          <button 
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            className="flex flex-col items-center justify-center space-y-1 text-[#8E8E93] dark:text-[#EBEBF5]/60 w-20 transition-transform active:scale-90"
          >
            <div className="w-12 h-12 rounded-full bg-ios-blue text-white flex items-center justify-center shadow-lg transform -translate-y-4">
              <ChevronUp size={24} strokeWidth={3} />
            </div>
          </button>

          <button 
            onClick={() => { tracker.saveSettingsNow(); tracker.setCurrentView('admin'); }}
            className={`flex flex-col items-center justify-center w-20 space-y-1 transition-all active:scale-90 ${tracker.currentView === 'admin' ? 'text-ios-blue' : 'text-[#8E8E93] dark:text-[#EBEBF5]/60'}`}
          >
            <SettingsIcon size={24} strokeWidth={tracker.currentView === 'admin' ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-none">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  if (!supabase) {
    return <ConfigError t={TRANSLATIONS['en']} />;
  }
  return <ExpenseTracker />;
}

=======
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { TRANSLATIONS } from './types';
import { useExpenseTracker } from './hooks/useExpenseTracker';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { SlipModal } from './components/SlipModal';
import { AdminPanel } from './components/AdminPanel';
import { ReviewModal } from './components/ReviewModal';

const ConfigError = ({ t }: { t: typeof TRANSLATIONS['en'] }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D0D14] p-6 font-sans text-slate-900 dark:text-white">
    <div className="card-elevated p-8 rounded-3xl max-w-sm w-full text-center animate-enter-card border border-slate-100 dark:border-white/5">
      <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-scale-in">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-xl font-bold mb-3">{t.connectionRequired}</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
        {t.connectionDesc}
      </p>
    </div>
  </div>
);

function ExpenseTracker() {
  const tracker = useExpenseTracker();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D14] font-sans text-slate-900 dark:text-white transition-colors duration-500 ease-smooth pb-20 overflow-x-hidden">
      
      <Header 
        darkMode={tracker.darkMode}
        setDarkMode={tracker.setDarkMode}
        lang={tracker.lang}
        toggleLanguage={tracker.toggleLanguage}
        isSyncing={tracker.isSyncing}
        userName={tracker.userName}
        onSettingsClick={() => { tracker.saveSettingsNow(); tracker.setCurrentView('admin'); }}
        glowEnabled={tracker.glowEnabled}
      />

      {tracker.currentView === 'admin' ? (
        <div className="animate-enter-card">
          <AdminPanel 
            lang={tracker.lang}
            onBack={() => { tracker.saveSettingsNow(); tracker.setCurrentView('dashboard'); }}
            categories={tracker.categories}
            setCategories={tracker.setCategories}
            onClearData={tracker.handleClearAll}
            budgetSettings={tracker.budgetSettings}
            setBudgetSettings={tracker.setBudgetSettings}
            userName={tracker.userName}
            setUserName={tracker.setUserName}
            glowEnabled={tracker.glowEnabled}
            setGlowEnabled={tracker.setGlowEnabled}
            saveSettingsNow={tracker.saveSettingsNow}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6">
            <BalanceCard 
              stats={tracker.stats}
              budgetSettings={tracker.budgetSettings}
              budgetPercent={tracker.budgetPercent}
              glowEnabled={tracker.glowEnabled}
              t={tracker.t}
            />

            <TransactionForm 
              amount={tracker.amount}
              setAmount={tracker.setAmount}
              type={tracker.type}
              setType={tracker.setType}
              category={tracker.category}
              setCategory={tracker.setCategory}
              isCustomCategory={tracker.isCustomCategory}
              setIsCustomCategory={tracker.setIsCustomCategory}
              note={tracker.note}
              setNote={tracker.setNote}
              file={tracker.file}
              setFile={tracker.setFile}
              formErrors={tracker.formErrors}
              setFormErrors={tracker.setFormErrors}
              categories={tracker.categories}
              submitting={tracker.submitting}
              isScanning={tracker.isScanning}
              t={tracker.t}
              handleSubmit={tracker.handleSubmit}
              handleCategoryChange={tracker.handleCategoryChange}
              handleManualFileSelect={tracker.handleManualFileSelect}
              handleScanSlip={tracker.handleScanSlip}
              scanInputRef={tracker.scanInputRef}
              glowEnabled={tracker.glowEnabled}
            />

            <AnalyticsPanel 
              transactions={tracker.transactions}
              chartView={tracker.chartView}
              setChartView={tracker.setChartView}
              handleDownloadChart={tracker.handleDownloadChart}
              chartRef={tracker.chartRef}
              glowEnabled={tracker.glowEnabled}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5">
            <TransactionList 
              filteredTransactions={tracker.filteredTransactions}
              loading={tracker.loading}
              lang={tracker.lang}
              t={tracker.t}
              glowEnabled={tracker.glowEnabled}
              filterCategory={tracker.filterCategory}
              setFilterCategory={tracker.setFilterCategory}
              searchTerm={tracker.searchTerm}
              setSearchTerm={tracker.setSearchTerm}
              availableFilterCategories={tracker.availableFilterCategories}
              handleDelete={tracker.handleDelete}
              handleViewSlip={tracker.handleViewSlip}
              handleExportCSV={tracker.handleExportCSV}
              handleImportCSV={tracker.handleImportCSV}
              triggerImport={tracker.triggerImport}
              fetchTransactions={tracker.fetchTransactions}
              fileInputRef={tracker.fileInputRef}
            />
          </div>
        </div>
      )}

      <SlipModal isOpen={tracker.modalOpen} onClose={() => tracker.setModalOpen(false)} imageUrl={tracker.selectedSlip} />
      
      <ReviewModal 
        isOpen={tracker.isReviewModalOpen}
        onClose={() => {
          tracker.setIsReviewModalOpen(false);
          tracker.setPendingScans([]);
        }}
        pendingScans={tracker.pendingScans}
        setPendingScans={tracker.setPendingScans}
        categories={tracker.categories}
        lang={tracker.lang}
        onConfirmAll={tracker.handleConfirmScans}
        isConfirming={tracker.isConfirmingScans}
        glowEnabled={tracker.glowEnabled}
      />
      
      {/* Footer */}
      <div className="text-center py-8 mt-8">
        <p className="text-[11px] text-slate-300 dark:text-slate-700 font-medium tracking-wide">Credit by Bus ✨</p>
      </div>
    </div>
  );
}

function App() {
  if (!supabase) {
    return <ConfigError t={TRANSLATIONS['en']} />;
  }
  return <ExpenseTracker />;
}

>>>>>>> 9397daf5b75fe4ccf81a23c3a16ae25ccfb2ccd3
export default App;