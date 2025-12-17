import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Tag,
  Space,
  Empty,
  Spin,
  Rate,
  Tooltip,
  Typography,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import {
  fetchMenuByDate,
  selectMenuByDate,
  selectYemekhaneLoading,
  selectSelectedDate,
} from '@/store/slices/yemekhaneSlice';
import { MEAL_CATEGORIES, getMealCategoryLabel } from '@/constants/mealMenuApi';

const { Text } = Typography;

const MenuView = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const menuByDate = useSelector(selectMenuByDate);
  const loading = useSelector(selectYemekhaneLoading);
  const selectedDate = useSelector(selectSelectedDate);

  // Fetch menu when date changes
  useEffect(() => {
    if (selectedDate) {
      dispatch(fetchMenuByDate(selectedDate));
    }
  }, [dispatch, selectedDate]);

  // Table columns
  const columns = [
    {
      title: t('yemekhane.foodName'),
      dataIndex: 'foodName',
      key: 'foodName',
      width: 200,
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {record.isVegetarian && (
            <Tag color="green">{t('yemekhane.vegetarian')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('yemekhane.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const label = getMealCategoryLabel(category);
        const colorMap = {
          soup: 'orange',
          mainCourse: 'blue',
          sideDish: 'cyan',
          salad: 'green',
          dessert: 'pink',
          drink: 'purple',
        };
        return <Tag color={colorMap[category] || 'default'}>{label}</Tag>;
      },
      filters: MEAL_CATEGORIES.map((cat) => ({
        text: cat.label,
        value: cat.value,
      })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: t('yemekhane.calories'),
      dataIndex: 'calories',
      key: 'calories',
      width: 100,
      render: (calories) => (calories ? `${calories} kcal` : '-'),
      sorter: (a, b) => (a.calories || 0) - (b.calories || 0),
    },
    {
      title: t('yemekhane.rating'),
      dataIndex: 'averageRating',
      key: 'averageRating',
      width: 150,
      render: (rating, record) => (
        <Space>
          <Rate disabled defaultValue={rating || 0} allowHalf />
          {record.ratingCount > 0 && (
            <Text type="secondary">({record.ratingCount})</Text>
          )}
        </Space>
      ),
      sorter: (a, b) => (a.averageRating || 0) - (b.averageRating || 0),
    },
    {
      title: t('yemekhane.allergens'),
      dataIndex: 'allergens',
      key: 'allergens',
      width: 150,
      render: (allergens) =>
        allergens && allergens.length > 0 ? (
          <Space size={[0, 4]} wrap>
            {allergens.map((allergen, index) => (
              <Tag key={index} color="red">
                {allergen}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: t('yemekhane.notes'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes) =>
        notes ? (
          <Tooltip title={notes}>
            <Space>
              <InfoCircleOutlined />
              <Text ellipsis style={{ maxWidth: 150 }}>
                {notes}
              </Text>
            </Space>
          </Tooltip>
        ) : (
          '-'
        ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!menuByDate || menuByDate.length === 0) {
    return (
      <Empty
        description={t('yemekhane.noMenuForDate')}
        className="py-12"
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={menuByDate}
      rowKey="id"
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} / ${total} ${t('common.items')}`,
      }}
      scroll={{ x: 900 }}
    />
  );
};

export default MenuView;
