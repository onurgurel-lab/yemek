/**
 * MenuForm.jsx - Menü Ekleme/Düzenleme Form Komponenti
 *
 * Eski projedeki MenuForm'un Ant Design uyarlaması
 * Modal içinde form ile menü ekleme ve düzenleme işlemleri
 *
 * @module pages/Yemekhane/components/MenuForm
 */

import React, { useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    DatePicker,
    Switch,
    Row,
    Col,
    Button,
    Divider,
    Typography,
    Space,
    Tag,
} from 'antd';
import {
    SaveOutlined,
    CloseOutlined,
    FireOutlined,
} from '@ant-design/icons';
import { MEAL_TIMES, MEAL_CATEGORIES } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

/**
 * Kategori listesi
 */
const CATEGORIES = [
    { value: 'ÇORBA', label: 'Çorba', icon: '🍲', color: '#3498db' },
    { value: 'ANA YEMEK', label: 'Ana Yemek', icon: '🍖', color: '#e74c3c' },
    { value: 'SPESYEL SALATA', label: 'Spesyel Salata', icon: '🥗', color: '#27ae60' },
    { value: 'YARDIMCI YEMEK', label: 'Yardımcı Yemek', icon: '🍛', color: '#f39c12' },
    { value: 'CORNER', label: 'Corner', icon: '🍕', color: '#9b59b6' },
];

/**
 * MenuForm Component
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal görünürlüğü
 * @param {Function} props.onClose - Modal kapatma fonksiyonu
 * @param {Function} props.onSubmit - Form submit callback'i
 * @param {Object} props.editingItem - Düzenlenen öğe (null ise yeni ekleme)
 * @param {string} props.selectedDate - Varsayılan tarih
 * @param {number} props.selectedMealTime - Varsayılan öğün
 * @param {boolean} props.loading - Yükleme durumu
 * @param {boolean} props.disablePastDates - Geçmiş tarihleri devre dışı bırak
 */
const MenuForm = ({
                      visible,
                      onClose,
                      onSubmit,
                      editingItem = null,
                      selectedDate,
                      selectedMealTime = MEAL_TIMES.LUNCH,
                      loading = false,
                      disablePastDates = true,
                  }) => {
    const [form] = Form.useForm();

    /**
     * Modal açıldığında form değerlerini ayarla
     */
    useEffect(() => {
        if (visible) {
            if (editingItem) {
                // Düzenleme modu
                form.setFieldsValue({
                    foodName: editingItem.foodName,
                    category: editingItem.category,
                    calories: editingItem.calories,
                    mealTime: editingItem.mealTime,
                    menuDate: editingItem.menuDate ? dayjs(editingItem.menuDate) : null,
                    notes: editingItem.notes || '',
                    isVegetarian: editingItem.isVegetarian || false,
                    allergens: editingItem.allergens || [],
                });
            } else {
                // Yeni ekleme modu
                form.resetFields();
                form.setFieldsValue({
                    menuDate: selectedDate ? dayjs(selectedDate) : dayjs().add(1, 'day'),
                    mealTime: selectedMealTime,
                    calories: 0,
                    isVegetarian: false,
                });
            }
        }
    }, [visible, editingItem, selectedDate, selectedMealTime, form]);

    /**
     * Geçmiş tarihler için DatePicker disable
     */
    const disabledDate = (current) => {
        if (!disablePastDates) return false;
        return current && current < dayjs().startOf('day');
    };

    /**
     * Form submit handler
     */
    const handleFinish = (values) => {
        const menuData = {
            foodName: values.foodName.trim(),
            category: values.category,
            calories: values.calories || 0,
            mealTime: values.mealTime,
            menuDate: values.menuDate
                ? values.menuDate.format('YYYY-MM-DDTHH:mm:ss')
                : dayjs(selectedDate).format('YYYY-MM-DDTHH:mm:ss'),
            notes: values.notes?.trim() || '',
            isVegetarian: values.isVegetarian || false,
            allergens: values.allergens || [],
        };

        // Düzenleme modunda ID ekle
        if (editingItem) {
            menuData.id = editingItem.id;
        }

        if (onSubmit) {
            onSubmit(menuData);
        }
    };

    /**
     * Modal kapatma
     */
    const handleClose = () => {
        if (!loading) {
            form.resetFields();
            onClose();
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <span style={{ fontSize: 20 }}>🍽️</span>
                    <span>{editingItem ? 'Menü Öğesini Düzenle' : 'Yeni Menü Öğesi Ekle'}</span>
                </Space>
            }
            open={visible}
            onCancel={handleClose}
            footer={null}
            destroyOnClose
            width={600}
            maskClosable={!loading}
            closable={!loading}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                    mealTime: selectedMealTime,
                    menuDate: dayjs(selectedDate),
                    calories: 0,
                    isVegetarian: false,
                }}
            >
                {/* Yemek Adı */}
                <Form.Item
                    name="foodName"
                    label="Yemek Adı"
                    rules={[
                        { required: true, message: 'Lütfen yemek adını girin' },
                        { min: 2, message: 'Yemek adı en az 2 karakter olmalıdır' },
                        { max: 100, message: 'Yemek adı en fazla 100 karakter olabilir' },
                    ]}
                >
                    <Input
                        placeholder="Örn: Mercimek Çorbası"
                        maxLength={100}
                        showCount
                        disabled={loading}
                    />
                </Form.Item>

                <Row gutter={16}>
                    {/* Kategori */}
                    <Col span={12}>
                        <Form.Item
                            name="category"
                            label="Kategori"
                            rules={[{ required: true, message: 'Lütfen kategori seçin' }]}
                        >
                            <Select
                                placeholder="Kategori seçin"
                                disabled={loading}
                                optionLabelProp="label"
                            >
                                {CATEGORIES.map((cat) => (
                                    <Option
                                        key={cat.value}
                                        value={cat.value}
                                        label={`${cat.icon} ${cat.label}`}
                                    >
                                        <Space>
                                            <span>{cat.icon}</span>
                                            <span>{cat.label}</span>
                                            <Tag color={cat.color} style={{ marginLeft: 8 }}>
                                                {cat.value}
                                            </Tag>
                                        </Space>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    {/* Kalori */}
                    <Col span={12}>
                        <Form.Item
                            name="calories"
                            label={
                                <Space>
                                    <FireOutlined style={{ color: '#ff7a45' }} />
                                    <span>Kalori (kcal)</span>
                                </Space>
                            }
                            rules={[
                                { type: 'number', min: 0, message: 'Kalori 0\'dan küçük olamaz' },
                                { type: 'number', max: 5000, message: 'Kalori 5000\'den büyük olamaz' },
                            ]}
                        >
                            <InputNumber
                                min={0}
                                max={5000}
                                style={{ width: '100%' }}
                                placeholder="Örn: 250"
                                disabled={loading}
                                addonAfter="kcal"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    {/* Tarih */}
                    <Col span={12}>
                        <Form.Item
                            name="menuDate"
                            label="Tarih"
                            rules={[{ required: true, message: 'Lütfen tarih seçin' }]}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                disabledDate={disabledDate}
                                format="DD MMMM YYYY"
                                placeholder="Tarih seçin"
                                disabled={loading}
                            />
                        </Form.Item>
                    </Col>

                    {/* Öğün */}
                    <Col span={12}>
                        <Form.Item
                            name="mealTime"
                            label="Öğün"
                            rules={[{ required: true, message: 'Lütfen öğün seçin' }]}
                        >
                            <Select disabled={loading}>
                                <Option value={MEAL_TIMES.LUNCH}>
                                    <Space>
                                        <span>🌞</span>
                                        <span>Öğle Yemeği</span>
                                    </Space>
                                </Option>
                                <Option value={MEAL_TIMES.DINNER}>
                                    <Space>
                                        <span>🌙</span>
                                        <span>Akşam Yemeği</span>
                                    </Space>
                                </Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    {/* Vejetaryen */}
                    <Col span={12}>
                        <Form.Item
                            name="isVegetarian"
                            label="Vejetaryen"
                            valuePropName="checked"
                        >
                            <Switch
                                disabled={loading}
                                checkedChildren="🥬 Evet"
                                unCheckedChildren="Hayır"
                            />
                        </Form.Item>
                    </Col>

                    {/* Alerjenler */}
                    <Col span={12}>
                        <Form.Item name="allergens" label="Alerjenler">
                            <Select
                                mode="tags"
                                placeholder="Alerjen ekleyin (virgül ile ayırın)"
                                tokenSeparators={[',']}
                                disabled={loading}
                                maxTagCount={3}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* Notlar */}
                <Form.Item
                    name="notes"
                    label="Notlar"
                    rules={[{ max: 500, message: 'Notlar en fazla 500 karakter olabilir' }]}
                >
                    <TextArea
                        rows={3}
                        placeholder="Opsiyonel notlar ekleyebilirsiniz..."
                        maxLength={500}
                        showCount
                        disabled={loading}
                    />
                </Form.Item>

                <Divider />

                {/* Butonlar */}
                <Row justify="end" gutter={8}>
                    <Col>
                        <Button
                            onClick={handleClose}
                            disabled={loading}
                            icon={<CloseOutlined />}
                        >
                            İptal
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<SaveOutlined />}
                        >
                            {editingItem ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default MenuForm;