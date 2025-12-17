import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  fetchMenuByDate,
  selectMenuByDate,
  selectYemekhaneLoading,
  selectSelectedDate,
} from '@/store/slices/yemekhaneSlice';
import { useNotification } from '@/hooks/useNotification';
import { MEAL_CATEGORIES, MEAL_TIMES } from '@/constants/mealMenuApi';
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '@/services/mealMenuService';

const { TextArea } = Input;

const MenuManagement = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useNotification();

  // Redux state
  const menuByDate = useSelector(selectMenuByDate);
  const loading = useSelector(selectYemekhaneLoading);
  const selectedDate = useSelector(selectSelectedDate);

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Filtered data
  const filteredData = (menuByDate || []).filter((item) =>
    item.foodName?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Open modal
  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue({
        ...item,
        date: item.date ? dayjs(item.date) : dayjs(),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        date: selectedDate ? dayjs(selectedDate) : dayjs(),
        isVegetarian: false,
      });
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
        showSuccess(t('messages.updateSuccess'));
      } else {
        await createMenuItem(payload);
        showSuccess(t('messages.createSuccess'));
      }

      closeModal();
      dispatch(fetchMenuByDate(selectedDate || dayjs().format('YYYY-MM-DD')));
    } catch (error) {
      showError(error.message || t('messages.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await deleteMenuItem(id);
      showSuccess(t('messages.deleteSuccess'));
      dispatch(fetchMenuByDate(selectedDate || dayjs().format('YYYY-MM-DD')));
    } catch (error) {
      showError(error.message || t('messages.error'));
    }
  };

  // Table columns
  const columns = [
    {
      title: t('yemekhane.foodName'),
      dataIndex: 'foodName',
      key: 'foodName',
      ellipsis: true,
    },
    {
      title: t('yemekhane.mealTime'),
      dataIndex: 'mealTime',
      key: 'mealTime',
      width: 100,
      render: (mealTime) => {
        const meal = MEAL_TIMES.find((m) => m.key === mealTime);
        return meal ? t(`yemekhane.mealTimes.${mealTime}`) : mealTime;
      },
    },
    {
      title: t('yemekhane.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const cat = MEAL_CATEGORIES.find((c) => c.value === category);
        return <Tag>{cat?.label || category}</Tag>;
      },
    },
    {
      title: t('yemekhane.calories'),
      dataIndex: 'calories',
      key: 'calories',
      width: 80,
      render: (cal) => (cal ? `${cal}` : '-'),
    },
    {
      title: t('yemekhane.vegetarian'),
      dataIndex: 'isVegetarian',
      key: 'isVegetarian',
      width: 100,
      render: (isVeg) => (
        <Tag color={isVeg ? 'green' : 'default'}>
          {isVeg ? t('common.yes') : t('common.no')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t('messages.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Tooltip title={t('common.delete')}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Toolbar */}
      <Row justify="space-between" className="mb-4">
        <Col>
          <Input
            placeholder={t('common.search')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            {t('yemekhane.addMenuItem')}
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} / ${total} ${t('common.items')}`,
        }}
        scroll={{ x: 800 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? t('yemekhane.editMenuItem') : t('yemekhane.addMenuItem')}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="foodName"
                label={t('yemekhane.foodName')}
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <Input placeholder={t('yemekhane.foodName')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label={t('yemekhane.date')}
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mealTime"
                label={t('yemekhane.mealTime')}
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <Select placeholder={t('yemekhane.selectMealTime')}>
                  {MEAL_TIMES.map((meal) => (
                    <Select.Option key={meal.key} value={meal.key}>
                      {t(`yemekhane.mealTimes.${meal.key}`)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label={t('yemekhane.category')}
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <Select placeholder={t('yemekhane.selectCategory')}>
                  {MEAL_CATEGORIES.map((cat) => (
                    <Select.Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="calories" label={t('yemekhane.calories')}>
                <InputNumber
                  min={0}
                  max={5000}
                  style={{ width: '100%' }}
                  placeholder="kcal"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isVegetarian"
                label={t('yemekhane.vegetarian')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="allergens" label={t('yemekhane.allergens')}>
            <Select
              mode="tags"
              placeholder={t('yemekhane.enterAllergens')}
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item name="notes" label={t('yemekhane.notes')}>
            <TextArea rows={3} placeholder={t('yemekhane.notesPlaceholder')} />
          </Form.Item>

          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={closeModal}>{t('common.cancel')}</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingItem ? t('common.update') : t('common.save')}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagement;
