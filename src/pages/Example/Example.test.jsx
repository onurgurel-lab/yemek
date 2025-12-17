import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import Example from './index'
import exampleReducer from '@/store/slices/exampleSlice'

/**
 * Example Component Test Suite
 *
 * Example bileşeninin tüm özelliklerini test eder:
 * - Render kontrolü (başlık, butonlar, tablo kolonları)
 * - Veri gösterimi (tablo içeriği, tarih formatı)
 * - Filtreleme işlemleri (arama, temizleme, aktif filtre sayısı)
 * - Modal işlemleri (ekleme, düzenleme, kapatma)
 * - Pagination (sayfalama bilgisi)
 * - Silme onayı
 * - Klavye olayları (Enter tuşu ile arama)
 * - Yükleme durumu
 */

// Mock i18next - Çoklu dil kütüphanesini simüle et
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key, // Çeviri key'ini olduğu gibi döndür
        i18n: {
            changeLanguage: () => new Promise(() => {}), // Dil değiştirme fonksiyonu
        },
    }),
}))

// Mock notification hook - Bildirim hook'unu simüle et
jest.mock('@/hooks/useNotification', () => ({
    useNotification: () => ({
        showSuccess: jest.fn(), // Başarı bildirimi mock fonksiyonu
        showError: jest.fn(),   // Hata bildirimi mock fonksiyonu
    }),
}))

// Mock ExampleForm component - Form bileşenini basit bir test versiyonu ile değiştir
jest.mock('./ExampleForm', () => ({
    __esModule: true,
    default: ({ onSuccess, onCancel }) => (
        <div data-testid="example-form">
            <button onClick={() => onSuccess({ name: 'Test' })}>Submit</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}))

// Mock data - Test için örnek veriler
const mockExamples = [
    {
        id: 1,
        patientFullName: 'Ahmet Yılmaz',
        patientEmail: 'ahmet@example.com',
        patientPhone: '0532 123 4567',
        doctor: 'Dr. Mehmet Demir',
        salesConsultant: 'Ayşe Kaya',
        patientNation: 'Türkiye',
        operationDate: '2024-01-15T00:00:00',
    },
    {
        id: 2,
        patientFullName: 'John Doe',
        patientEmail: 'john@example.com',
        patientPhone: '0533 987 6543',
        doctor: 'Dr. Sarah Wilson',
        salesConsultant: 'Ali Veli',
        patientNation: 'USA',
        operationDate: '2024-02-20T00:00:00',
    },
]

/**
 * createMockStore - Test için mock Redux store oluşturur
 *
 * @param {Object} initialState - Store'un başlangıç state'i
 * @returns {Store} Yapılandırılmış mock Redux store
 */
const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            example: exampleReducer, // Example reducer'ını kullan
        },
        preloadedState: {
            example: {
                examples: initialState.examples || [],
                loading: initialState.loading || false,
                totalRecords: initialState.totalRecords || 0,
                pageNumber: initialState.pageNumber || 1,
                pageSize: initialState.pageSize || 30,
                totalPages: initialState.totalPages || 0,
                error: null,
            },
        },
    })
}

/**
 * renderWithProviders - Bileşeni gerekli provider'lar ile render eder
 *
 * Redux Provider ve Router ile sarmalanmış bileşeni render eder.
 * Bu sayede test ortamında gerçek uygulamayı simüle eder.
 *
 * @param {ReactElement} component - Render edilecek bileşen
 * @param {Store} store - Redux store (varsayılan: boş store)
 * @returns {RenderResult} Testing Library render sonucu
 */
const renderWithProviders = (component, store = createMockStore()) => {
    return render(
        <Provider store={store}>
            <BrowserRouter>{component}</BrowserRouter>
        </Provider>
    )
}

describe('Example Component', () => {
    // Her test öncesi mock'ları temizle
    beforeEach(() => {
        jest.clearAllMocks()
    })

    /**
     * Rendering Tests - Bileşen render testleri
     * Sayfa elemanlarının doğru şekilde render edildiğini kontrol eder
     */
    describe('Rendering', () => {
        test('renders page title', () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 2,
            })

            renderWithProviders(<Example />, store)

            // Sayfa başlığının ekranda olduğunu kontrol et
            expect(screen.getByText('Example Page')).toBeInTheDocument()
        })

        test('displays total record count', () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 2,
            })

            renderWithProviders(<Example />, store)

            // Toplam kayıt sayısının gösterildiğini kontrol et
            expect(screen.getByText('(2 kayıt)')).toBeInTheDocument()
        })

        test('renders add button', () => {
            renderWithProviders(<Example />)

            // Ekleme butonunun render edildiğini kontrol et
            const addButton = screen.getByRole('button', { name: /common.add/i })
            expect(addButton).toBeInTheDocument()
        })

        test('renders filter button', () => {
            renderWithProviders(<Example />)

            // Filtreleme butonunun render edildiğini kontrol et
            expect(screen.getByText('Filtrele')).toBeInTheDocument()
        })

        test('renders table with correct columns', () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 2,
            })

            renderWithProviders(<Example />, store)

            // Tüm tablo kolonlarının başlıklarını kontrol et
            expect(screen.getByText('ID')).toBeInTheDocument()
            expect(screen.getByText('example.form.name')).toBeInTheDocument()
            expect(screen.getByText('E-posta')).toBeInTheDocument()
            expect(screen.getByText('Telefon')).toBeInTheDocument()
            expect(screen.getByText('Doktor')).toBeInTheDocument()
            expect(screen.getByText('Satış Danışmanı')).toBeInTheDocument()
            expect(screen.getByText('Ülke')).toBeInTheDocument()
            expect(screen.getByText('Operasyon Tarihi')).toBeInTheDocument()
            expect(screen.getByText('common.actions')).toBeInTheDocument()
        })
    })

    /**
     * Data Display Tests - Veri gösterim testleri
     * Tabloda verilerin doğru şekilde gösterildiğini kontrol eder
     */
    describe('Data Display', () => {
        test('displays example data in table', () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 2,
            })

            renderWithProviders(<Example />, store)

            // Mock verilerin tabloda gösterildiğini kontrol et
            expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument()
            expect(screen.getByText('ahmet@example.com')).toBeInTheDocument()
            expect(screen.getByText('0532 123 4567')).toBeInTheDocument()
            expect(screen.getByText('Dr. Mehmet Demir')).toBeInTheDocument()
            expect(screen.getByText('John Doe')).toBeInTheDocument()
            expect(screen.getByText('john@example.com')).toBeInTheDocument()
        })

        test('formats operation date correctly', () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 2,
            })

            renderWithProviders(<Example />, store)

            // Tarihlerin doğru formatta gösterildiğini kontrol et (DD.MM.YYYY)
            expect(screen.getByText('15.01.2024')).toBeInTheDocument()
            expect(screen.getByText('20.02.2024')).toBeInTheDocument()
        })

        test('displays edit and delete buttons for each row', () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 2,
            })

            renderWithProviders(<Example />, store)

            // Her satır için düzenleme ve silme butonlarının olduğunu kontrol et
            const editButtons = screen.getAllByRole('button', { name: /common.edit/i })
            const deleteButtons = screen.getAllByRole('button', { name: /common.delete/i })

            expect(editButtons).toHaveLength(2)
            expect(deleteButtons).toHaveLength(2)
        })

        test('shows empty table when no data', () => {
            const store = createMockStore({
                examples: [],
                totalRecords: 0,
            })

            renderWithProviders(<Example />, store)

            // Veri olmadığında boş tablo gösterildiğini kontrol et
            const table = screen.getByRole('table')
            expect(table).toBeInTheDocument()
        })
    })

    /**
     * Filter Functionality Tests - Filtreleme işlevi testleri
     * Arama ve filtreleme özelliklerinin çalıştığını kontrol eder
     */
    describe('Filter Functionality', () => {
        test('toggles filter section on button click', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')

            // Başlangıçta filtre alanının kapalı olduğunu kontrol et
            expect(screen.queryByPlaceholderText(/Hasta adı, e-posta, telefon/i)).not.toBeInTheDocument()

            // Filtre butonuna tıkla
            fireEvent.click(filterButton)

            // Filtre alanının açıldığını kontrol et
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Hasta adı, e-posta, telefon/i)).toBeInTheDocument()
            })
        })

        test('displays search inputs when filter is open', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            // Filtre açıldığında tüm arama alanlarının gösterildiğini kontrol et
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Hasta adı, e-posta, telefon/i)).toBeInTheDocument()
                expect(screen.getByPlaceholderText(/Hasta adı ile filtrele/i)).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /Ara/i })).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /Temizle/i })).toBeInTheDocument()
            })
        })

        test('updates search input value on change', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText(/Hasta adı, e-posta, telefon/i)
                // Input değerini değiştir
                fireEvent.change(searchInput, { target: { value: 'test search' } })
                // Değerin güncellendiğini kontrol et
                expect(searchInput.value).toBe('test search')
            })
        })

        test('updates name filter input value on change', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            await waitFor(() => {
                const nameInput = screen.getByPlaceholderText(/Hasta adı ile filtrele/i)
                // Hasta adı filtresini güncelle
                fireEvent.change(nameInput, { target: { value: 'Ahmet' } })
                expect(nameInput.value).toBe('Ahmet')
            })
        })

        test('clears filters on clear button click', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            await waitFor(async () => {
                const searchInput = screen.getByPlaceholderText(/Hasta adı, e-posta, telefon/i)
                fireEvent.change(searchInput, { target: { value: 'test' } })

                // Temizle butonuna tıkla
                const clearButton = screen.getByRole('button', { name: /Temizle/i })
                fireEvent.click(clearButton)

                // Input'un temizlendiğini kontrol et
                await waitFor(() => {
                    expect(searchInput.value).toBe('')
                })
            })
        })

        test('shows active filter count badge', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText(/Hasta adı, e-posta, telefon/i)
                fireEvent.change(searchInput, { target: { value: 'test' } })

                const searchButton = screen.getByRole('button', { name: /Ara/i })
                fireEvent.click(searchButton)
            })

            // Aktif filtre sayısının badge olarak gösterildiğini kontrol et
            await waitFor(() => {
                const badges = document.querySelectorAll('.ant-badge-count')
                expect(badges.length).toBeGreaterThan(0)
            })
        })

        test('displays applied filters as tags', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText(/Hasta adı, e-posta, telefon/i)
                fireEvent.change(searchInput, { target: { value: 'test search' } })

                const searchButton = screen.getByRole('button', { name: /Ara/i })
                fireEvent.click(searchButton)
            })

            // Uygulanan filtrelerin tag olarak gösterildiğini kontrol et
            await waitFor(() => {
                expect(screen.getByText(/Arama: "test search"/i)).toBeInTheDocument()
            })
        })
    })

    /**
     * Modal Functionality Tests - Modal işlevi testleri
     * Ekleme, düzenleme modallarının çalıştığını kontrol eder
     */
    describe('Modal Functionality', () => {
        test('opens add modal on add button click', async () => {
            renderWithProviders(<Example />)

            const addButton = screen.getByRole('button', { name: /common.add/i })
            fireEvent.click(addButton)

            // Ekleme modalının açıldığını kontrol et
            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument()
                expect(screen.getByTestId('example-form')).toBeInTheDocument()
            })
        })

        test('opens edit modal on edit button click', async () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 2,
            })

            renderWithProviders(<Example />, store)

            const editButtons = screen.getAllByRole('button', { name: /common.edit/i })
            fireEvent.click(editButtons[0])

            // Düzenleme modalının açıldığını kontrol et
            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument()
                expect(screen.getByTestId('example-form')).toBeInTheDocument()
            })
        })

        test('closes modal on cancel button click', async () => {
            renderWithProviders(<Example />)

            const addButton = screen.getByRole('button', { name: /common.add/i })
            fireEvent.click(addButton)

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument()
            })

            // Cancel butonuna tıklayınca modalın kapandığını kontrol et
            const cancelButton = screen.getByText('Cancel')
            fireEvent.click(cancelButton)

            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
            })
        })
    })

    /**
     * Pagination Tests - Sayfalama testleri
     * Pagination bilgilerinin doğru gösterildiğini kontrol eder
     */
    describe('Pagination', () => {
        test('displays pagination information', () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 50,
                pageNumber: 1,
                pageSize: 30,
            })

            renderWithProviders(<Example />, store)

            // Pagination bilgisinin gösterildiğini kontrol et
            expect(screen.getByText(/50 kayıt/i)).toBeInTheDocument()
        })

        test('shows filtered indicator in pagination', async () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 2,
            })

            renderWithProviders(<Example />, store)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText(/Hasta adı, e-posta, telefon/i)
                fireEvent.change(searchInput, { target: { value: 'test' } })

                const searchButton = screen.getByRole('button', { name: /Ara/i })
                fireEvent.click(searchButton)
            })

            // Filtrelenmiş göstergesinin pagination'da olduğunu kontrol et
            await waitFor(() => {
                expect(screen.getByText(/filtrelenmiş/i)).toBeInTheDocument()
            })
        })
    })

    /**
     * Loading State Tests - Yükleme durumu testleri
     * Loading state'inin doğru çalıştığını kontrol eder
     */
    describe('Loading State', () => {
        test('shows loading state', () => {
            const store = createMockStore({
                examples: [],
                loading: true,
                totalRecords: 0,
            })

            renderWithProviders(<Example />, store)

            // Loading durumunda tablonun render edildiğini kontrol et
            const table = screen.getByRole('table')
            expect(table).toBeInTheDocument()
        })
    })

    /**
     * Delete Functionality Tests - Silme işlevi testleri
     * Silme onay modalının çalıştığını kontrol eder
     */
    describe('Delete Functionality', () => {
        test('shows delete confirmation modal', async () => {
            const store = createMockStore({
                examples: mockExamples,
                totalRecords: 2,
            })

            renderWithProviders(<Example />, store)

            const deleteButtons = screen.getAllByRole('button', { name: /common.delete/i })
            fireEvent.click(deleteButtons[0])

            // Silme onay modalının gösterildiğini kontrol et
            await waitFor(() => {
                expect(screen.getByText('common.confirm')).toBeInTheDocument()
                expect(screen.getByText('messages.confirmDelete')).toBeInTheDocument()
            })
        })
    })

    /**
     * Keyboard Events Tests - Klavye olayları testleri
     * Enter tuşu ile arama işlevini kontrol eder
     */
    describe('Keyboard Events', () => {
        test('triggers search on Enter key press in search input', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText(/Hasta adı, e-posta, telefon/i)
                fireEvent.change(searchInput, { target: { value: 'test' } })
                // Enter tuşuna basınca arama yapıldığını kontrol et
                fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 })
            })

            await waitFor(() => {
                expect(screen.getByText(/Arama: "test"/i)).toBeInTheDocument()
            })
        })

        test('triggers search on Enter key press in name input', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            await waitFor(() => {
                const nameInput = screen.getByPlaceholderText(/Hasta adı ile filtrele/i)
                fireEvent.change(nameInput, { target: { value: 'Ahmet' } })
                // Enter tuşu ile hasta adı araması yapıldığını kontrol et
                fireEvent.keyPress(nameInput, { key: 'Enter', code: 'Enter', charCode: 13 })
            })

            await waitFor(() => {
                expect(screen.getByText(/Hasta Adı: "Ahmet"/i)).toBeInTheDocument()
            })
        })
    })

    /**
     * Responsive Behavior Tests - Responsive davranış testleri
     * Farklı ekran boyutlarında görünümü kontrol eder
     */
    describe('Responsive Behavior', () => {
        test('renders filter section correctly', async () => {
            renderWithProviders(<Example />)

            const filterButton = screen.getByText('Filtrele')
            fireEvent.click(filterButton)

            // Filtre bölümünün doğru şekilde render edildiğini kontrol et
            await waitFor(() => {
                expect(screen.getByText('Genel Arama')).toBeInTheDocument()
                expect(screen.getByText('Hasta Adı')).toBeInTheDocument()
            })
        })
    })
})