/**
 * SearchFilter.jsx - Yemek Arama Filtresi
 *
 * Yemek adına göre arama yapılmasını sağlar.
 *
 * @module pages/Yemekhane/components/SearchFilter
 */

import React, { useState, useCallback } from 'react';
import { Input, Button, Space, Typography } from 'antd';
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';

const { Search } = Input;
const { Text } = Typography;

/**
 * SearchFilter - Yemek Arama Bileşeni
 *
 * @param {Object} props
 * @param {Function} props.onSearch - Arama callback fonksiyonu
 * @param {boolean} props.loading - Yükleme durumu
 * @param {string} props.placeholder - Input placeholder
 */
const SearchFilter = ({
                          onSearch,
                          loading = false,
                          placeholder = "Yemek adı ara..."
                      }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value) => {
            onSearch?.(value);
        }, 300),
        [onSearch]
    );

    // Handle input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    // Handle search button click
    const handleSearch = (value) => {
        onSearch?.(value || searchTerm);
    };

    // Clear search
    const handleClear = () => {
        setSearchTerm('');
        onSearch?.('');
    };

    return (
        <div className="search-filter" style={{ width: '100%', maxWidth: 500 }}>
            <Space.Compact style={{ width: '100%' }}>
                <Search
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onSearch={handleSearch}
                    allowClear
                    enterButton={<SearchOutlined />}
                    loading={loading}
                    size="large"
                />
            </Space.Compact>

            {searchTerm && (
                <div style={{ marginTop: 8 }}>
                    <Space>
                        <Text type="secondary">
                            Aranan: "{searchTerm}"
                        </Text>
                        <Button
                            type="link"
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={handleClear}
                        >
                            Temizle
                        </Button>
                    </Space>
                </div>
            )}
        </div>
    );
};

export default SearchFilter;