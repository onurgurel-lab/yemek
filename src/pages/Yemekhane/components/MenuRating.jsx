import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Rate, Input, Button, List, Avatar, Space, Typography, message, Spin, Empty, Popconfirm, Tag, Tooltip, Badge } from 'antd';
import { StarOutlined, EditOutlined, DeleteOutlined, UserOutlined, CommentOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { menuPointService, menuCommentService } from '@/services/evaluationService';
import { RATING_DESCRIPTIONS } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;

const MenuRating = ({ menuItem, visible, onClose, onUpdate }) => {
    const { user } = useAuth();

    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [existingPoint, setExistingPoint] = useState(null);
    const [existingComment, setExistingComment] = useState(null);
    const [allPoints, setAllPoints] = useState([]);
    const [allComments, setAllComments] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    // Check if today
    const isToday = useCallback(() => {
        if (!menuItem?.menuDate) return false;
        return dayjs(menuItem.menuDate).isSame(dayjs(), 'day');
    }, [menuItem]);

    // Load data
    const loadData = useCallback(async () => {
        if (!menuItem?.id) return;

        setLoading(true);
        try {
            // Load all points and comments
            const [pointsRes, commentsRes, avgRes] = await Promise.all([
                menuPointService.getPointsByMenuId(menuItem.id),
                menuCommentService.getCommentsByMenuId(menuItem.id),
                menuPointService.getAverageRating(menuItem.id)
            ]);

            const points = pointsRes?.data || [];
            const comments = commentsRes?.data || [];

            setAllPoints(points);
            setAllComments(comments);
            setAverageRating(avgRes?.data?.average || 0);

            // Find user's existing evaluation
            const userPoint = points.find(p => p.uId === user?.uId);
            const userCommentData = comments.find(c => c.uId === user?.uId);

            if (userPoint) {
                setExistingPoint(userPoint);
                setUserRating(userPoint.point || 0);
            } else {
                setExistingPoint(null);
                setUserRating(0);
            }

            if (userCommentData) {
                setExistingComment(userCommentData);
                setUserComment(userCommentData.comment || '');
            } else {
                setExistingComment(null);
                setUserComment('');
            }

            setIsEditing(false);
        } catch (error) {
            console.error('Değerlendirme verileri yüklenirken hata:', error);
            message.error('Değerlendirmeler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [menuItem, user]);

    useEffect(() => {
        if (visible && menuItem) {
            loadData();
        }
    }, [visible, menuItem, loadData]);

    // Handle rating change
    const handleRatingChange = (value) => {
        setUserRating(value);
    };

    // Handle comment change
    const handleCommentChange = (e) => {
        const value = e.target.value;
        if (value.length <= 500) {
            setUserComment(value);
        }
    };

    // Submit evaluation
    const handleSubmit = async () => {
        if (!isToday()) {
            message.warning('Sadece bugünün menüsünü değerlendirebilirsiniz');
            return;
        }

        if (userRating === 0) {
            message.warning('Lütfen bir puan verin');
            return;
        }

        setSubmitting(true);
        try {
            // Handle point
            if (existingPoint) {
                await menuPointService.updatePoint(existingPoint.id, {
                    point: userRating,
                    menuId: menuItem.id
                });
            } else {
                await menuPointService.addPoint({
                    point: userRating,
                    menuId: menuItem.id
                });
            }

            // Handle comment if provided
            if (userComment.trim()) {
                if (existingComment) {
                    await menuCommentService.updateComment(existingComment.id, {
                        comment: userComment.trim(),
                        menuId: menuItem.id
                    });
                } else {
                    await menuCommentService.addComment({
                        comment: userComment.trim(),
                        menuId: menuItem.id
                    });
                }
            }

            message.success(existingPoint ? 'Değerlendirme güncellendi' : 'Değerlendirme kaydedildi');
            setIsEditing(false);
            loadData();
            onUpdate?.();
        } catch (error) {
            console.error('Değerlendirme kaydedilirken hata:', error);
            message.error('Değerlendirme kaydedilemedi');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete evaluation
    const handleDelete = async () => {
        if (!isToday()) {
            message.warning('Sadece bugünün değerlendirmesini silebilirsiniz');
            return;
        }

        setSubmitting(true);
        try {
            if (existingPoint) {
                await menuPointService.deletePoint(existingPoint.id);
            }
            if (existingComment) {
                await menuCommentService.deleteComment(existingComment.id);
            }

            message.success('Değerlendirme silindi');
            setUserRating(0);
            setUserComment('');
            setExistingPoint(null);
            setExistingComment(null);
            setIsEditing(false);
            loadData();
            onUpdate?.();
        } catch (error) {
            console.error('Değerlendirme silinirken hata:', error);
            message.error('Değerlendirme silinemedi');
        } finally {
            setSubmitting(false);
        }
    };

    // Start editing
    const handleStartEdit = () => {
        if (!isToday()) {
            message.warning('Sadece bugünün değerlendirmesini düzenleyebilirsiniz');
            return;
        }
        setIsEditing(true);
    };

    // Cancel editing
    const handleCancelEdit = () => {
        if (existingPoint) {
            setUserRating(existingPoint.point || 0);
        } else {
            setUserRating(0);
        }
        if (existingComment) {
            setUserComment(existingComment.comment || '');
        } else {
            setUserComment('');
        }
        setIsEditing(false);
    };

    // Get rating description
    const getRatingDesc = (value) => {
        return RATING_DESCRIPTIONS[value] || '';
    };

    // Format date
    const formatDate = (dateString) => {
        return dayjs(dateString).format('DD.MM.YYYY HH:mm');
    };

    const canEvaluate = isToday();
    const hasExistingEvaluation = existingPoint !== null;
    const showForm = canEvaluate && (isEditing || !hasExistingEvaluation);

    return (
        <Modal
            title={
                <Space>
                    <StarOutlined />
                    <span>{menuItem?.foodName || 'Yemek'} - Değerlendirme</span>
                    <Badge count={allPoints.length} style={{ backgroundColor: '#1890ff' }} />
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
            destroyOnClose
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <div>
                    {/* Average Rating */}
                    <div style={{ textAlign: 'center', marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                        <Text type="secondary">Ortalama Puan</Text>
                        <div style={{ marginTop: 8 }}>
                            <Rate disabled value={averageRating} allowHalf />
                            <Text strong style={{ marginLeft: 8, fontSize: 18 }}>
                                {averageRating.toFixed(1)} / 5
                            </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            ({allPoints.length} değerlendirme)
                        </Text>
                    </div>

                    {/* User's Evaluation Section */}
                    <div style={{ marginBottom: 24 }}>
                        <Title level={5}>
                            <UserOutlined style={{ marginRight: 8 }} />
                            Değerlendirmeniz
                        </Title>

                        {!canEvaluate && !hasExistingEvaluation && (
                            <Empty
                                description="Sadece bugünün menüsünü değerlendirebilirsiniz"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}

                        {hasExistingEvaluation && !isEditing && (
                            <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <Rate disabled value={userRating} />
                                        <Text style={{ marginLeft: 8 }}>{getRatingDesc(userRating)}</Text>
                                    </div>
                                    {existingComment && (
                                        <div>
                                            <Text type="secondary">Yorumunuz:</Text>
                                            <div style={{ marginTop: 4 }}>{existingComment.comment}</div>
                                        </div>
                                    )}
                                    {canEvaluate && (
                                        <Space style={{ marginTop: 8 }}>
                                            <Button icon={<EditOutlined />} onClick={handleStartEdit}>
                                                Düzenle
                                            </Button>
                                            <Popconfirm
                                                title="Değerlendirmeyi sil"
                                                description="Değerlendirmenizi silmek istediğinize emin misiniz?"
                                                onConfirm={handleDelete}
                                                okText="Evet"
                                                cancelText="Hayır"
                                            >
                                                <Button danger icon={<DeleteOutlined />} loading={submitting}>
                                                    Sil
                                                </Button>
                                            </Popconfirm>
                                        </Space>
                                    )}
                                </Space>
                            </div>
                        )}

                        {showForm && (
                            <div style={{ padding: 16, background: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <Text>Puanınız:</Text>
                                        <div style={{ marginTop: 8 }}>
                                            <Rate
                                                value={userRating}
                                                onChange={handleRatingChange}
                                                tooltips={Object.values(RATING_DESCRIPTIONS)}
                                            />
                                            {userRating > 0 && (
                                                <Text style={{ marginLeft: 8 }}>{getRatingDesc(userRating)}</Text>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Text>Yorumunuz (isteğe bağlı):</Text>
                                        <TextArea
                                            value={userComment}
                                            onChange={handleCommentChange}
                                            placeholder="Yemek hakkında düşüncelerinizi yazın..."
                                            rows={3}
                                            maxLength={500}
                                            showCount
                                            style={{ marginTop: 8 }}
                                        />
                                    </div>
                                    <Space style={{ marginTop: 8 }}>
                                        <Button
                                            type="primary"
                                            onClick={handleSubmit}
                                            loading={submitting}
                                            disabled={userRating === 0}
                                        >
                                            {hasExistingEvaluation ? 'Güncelle' : 'Kaydet'}
                                        </Button>
                                        {isEditing && (
                                            <Button onClick={handleCancelEdit}>İptal</Button>
                                        )}
                                    </Space>
                                </Space>
                            </div>
                        )}
                    </div>

                    {/* All Comments Section */}
                    {allComments.length > 0 && (
                        <div>
                            <Title level={5}>
                                <CommentOutlined style={{ marginRight: 8 }} />
                                Tüm Yorumlar ({allComments.length})
                            </Title>
                            <List
                                itemLayout="horizontal"
                                dataSource={allComments}
                                style={{ maxHeight: 300, overflow: 'auto' }}
                                renderItem={(comment) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                            }
                                            title={
                                                <Space>
                                                    <Text strong>{comment.userName || 'Anonim'}</Text>
                                                    {comment.uId === user?.uId && (
                                                        <Tag color="blue" size="small">Siz</Tag>
                                                    )}
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {formatDate(comment.createdAt)}
                                                    </Text>
                                                </Space>
                                            }
                                            description={comment.comment}
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}

                    {allComments.length === 0 && allPoints.length > 0 && (
                        <Empty
                            description="Henüz yorum yapılmamış"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </div>
            )}
        </Modal>
    );
};

export default MenuRating;