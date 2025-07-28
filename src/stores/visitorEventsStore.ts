import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { VisitorEvent, VisitorEventModalState } from '@/types/visitor-events';

interface VisitorEventsStore {
  // Modal state
  modalState: VisitorEventModalState;
  
  // Data state
  visitorEvents: VisitorEvent[];
  isLoading: boolean;
  
  // Filter/Search state
  searchQuery: string;
  statusFilter: string | null;
  activeFilter: string | null;
  
  // Pagination state
  currentPage: number;
  pageSize: number;
  
  // Actions
  setModalState: (state: Partial<VisitorEventModalState>) => void;
  openCreateModal: () => void;
  openEditModal: (event: VisitorEvent) => void;
  openDeleteModal: (event: VisitorEvent) => void;
  closeModal: () => void;
  
  // Data actions
  setVisitorEvents: (events: VisitorEvent[]) => void;
  addVisitorEvent: (event: VisitorEvent) => void;
  updateVisitorEvent: (event: VisitorEvent) => void;
  removeVisitorEvent: (eventId: string) => void;
  setLoading: (loading: boolean) => void;
  
  // Filter actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string | null) => void;
  setActiveFilter: (active: string | null) => void;
  clearFilters: () => void;
  
  // Pagination actions
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetPagination: () => void;
}

export const useVisitorEventsStore = create<VisitorEventsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      modalState: {
        isOpen: false,
        mode: null,
        selectedEvent: null,
      },
      
      visitorEvents: [],
      isLoading: false,
      
      searchQuery: '',
      statusFilter: null,
      activeFilter: null,
      
      currentPage: 1,
      pageSize: 10,
      
      // Modal actions
      setModalState: (state) =>
        set((current) => ({
          modalState: { ...current.modalState, ...state }
        })),
      
      openCreateModal: () =>
        set({
          modalState: {
            isOpen: true,
            mode: 'create',
            selectedEvent: null,
          }
        }),
      
      openEditModal: (event) =>
        set({
          modalState: {
            isOpen: true,
            mode: 'edit',
            selectedEvent: event,
          }
        }),
      
      openDeleteModal: (event) =>
        set({
          modalState: {
            isOpen: true,
            mode: 'delete',
            selectedEvent: event,
          }
        }),
      
      closeModal: () =>
        set({
          modalState: {
            isOpen: false,
            mode: null,
            selectedEvent: null,
          }
        }),
      
      // Data actions
      setVisitorEvents: (events) =>
        set({ visitorEvents: events }),
      
      addVisitorEvent: (event) =>
        set((state) => ({
          visitorEvents: [event, ...state.visitorEvents]
        })),
      
      updateVisitorEvent: (updatedEvent) =>
        set((state) => ({
          visitorEvents: state.visitorEvents.map(event =>
            event.id === updatedEvent.id ? updatedEvent : event
          )
        })),
      
      removeVisitorEvent: (eventId) =>
        set((state) => ({
          visitorEvents: state.visitorEvents.filter(event => event.id !== eventId)
        })),
      
      setLoading: (loading) =>
        set({ isLoading: loading }),
      
      // Filter actions
      setSearchQuery: (query) =>
        set({ searchQuery: query, currentPage: 1 }),
      
      setStatusFilter: (status) =>
        set({ statusFilter: status, currentPage: 1 }),
      
      setActiveFilter: (active) =>
        set({ activeFilter: active, currentPage: 1 }),
      
      clearFilters: () =>
        set({
          searchQuery: '',
          statusFilter: null,
          activeFilter: null,
          currentPage: 1,
        }),
      
      // Pagination actions
      setCurrentPage: (page) =>
        set({ currentPage: page }),
      
      setPageSize: (size) =>
        set({ pageSize: size, currentPage: 1 }),
      
      resetPagination: () =>
        set({ currentPage: 1 }),
    }),
    {
      name: 'visitor-events-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        statusFilter: state.statusFilter,
        activeFilter: state.activeFilter,
        currentPage: state.currentPage,
        pageSize: state.pageSize,
      }),
    }
  )
);