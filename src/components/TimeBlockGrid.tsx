'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/store/planner';
import { Plus, Lock, Unlock } from 'lucide-react';
import styles from './TimeBlockGrid.module.css';

interface TimeBlockGridProps {
    date: string;
}

const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM

const categoryColors = {
    work: 'var(--color-category-work)',
    personal: 'var(--color-category-personal)',
    health: 'var(--color-category-health)',
    learning: 'var(--color-category-learning)',
    social: 'var(--color-category-social)',
    focus: 'var(--color-accent-primary)',
    break: 'var(--color-text-tertiary)',
};

export default function TimeBlockGrid({ date }: TimeBlockGridProps) {
    const { timeBlocks, addTimeBlock, deleteTimeBlock, activeProjectId } = usePlannerStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [blockTitle, setBlockTitle] = useState('');
    const [blockCategory, setBlockCategory] = useState<keyof typeof categoryColors>('work');
    const [isBlocked, setIsBlocked] = useState(false);

    const dayBlocks = timeBlocks.filter(b =>
        b.date === date &&
        (!activeProjectId || b.project_id === activeProjectId)
    );

    const getBlockAtHour = (hour: number) => {
        return dayBlocks.find(b => {
            const startHour = parseInt(b.startTime.split(':')[0]);
            const endHour = parseInt(b.endTime.split(':')[0]);
            return hour >= startHour && hour < endHour;
        });
    };

    const formatHour = (hour: number) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${h} ${ampm}`;
    };

    const handleHourClick = (hour: number) => {
        const existingBlock = getBlockAtHour(hour);
        if (!existingBlock) {
            setSelectedHour(hour);
            setShowAddModal(true);
        }
    };

    const handleAddBlock = () => {
        if (selectedHour !== null && blockTitle.trim()) {
            addTimeBlock({
                title: blockTitle.trim(),
                startTime: `${selectedHour.toString().padStart(2, '0')}:00`,
                endTime: `${(selectedHour + 1).toString().padStart(2, '0')}:00`,
                date,
                category: blockCategory,
                isBlocked,
            });
            setBlockTitle('');
            setShowAddModal(false);
            setSelectedHour(null);
        }
    };

    return (
        <div className={styles.timeBlockGrid}>
            <div className={styles.gridHeader}>
                <span className={styles.timeLabel}>Time</span>
                <span className={styles.blockLabel}>Activity</span>
            </div>

            <div className={styles.grid}>
                {hours.map(hour => {
                    const block = getBlockAtHour(hour);
                    const isCurrentHour = new Date().getHours() === hour &&
                        new Date().toISOString().split('T')[0] === date;

                    return (
                        <div
                            key={hour}
                            className={`${styles.hourRow} ${isCurrentHour ? styles.currentHour : ''}`}
                        >
                            <div className={styles.hourLabel}>
                                {formatHour(hour)}
                                {isCurrentHour && <span className={styles.nowIndicator}>NOW</span>}
                            </div>

                            <div
                                className={`${styles.hourBlock} ${block ? styles.hasBlock : ''}`}
                                onClick={() => handleHourClick(hour)}
                            >
                                {block ? (
                                    <div
                                        className={styles.blockContent}
                                        style={{ '--block-color': categoryColors[block.category] } as React.CSSProperties}
                                    >
                                        <span className={styles.blockTitle}>{block.title}</span>
                                        {block.isBlocked && (
                                            <Lock size={12} className={styles.blockIcon} />
                                        )}
                                        <button
                                            className={styles.deleteBlock}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteTimeBlock(block.id);
                                            }}
                                            aria-label="Delete block"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.emptyBlock}>
                                        <Plus size={14} />
                                        <span>Add block</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Block Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h4 className={styles.modalTitle}>Add Time Block</h4>
                        <p className={styles.modalTime}>
                            {selectedHour !== null && `${formatHour(selectedHour)} - ${formatHour(selectedHour + 1)}`}
                        </p>

                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                placeholder="Block title..."
                                value={blockTitle}
                                onChange={(e) => setBlockTitle(e.target.value)}
                                className={styles.input}
                                autoFocus
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Category</label>
                            <div className={styles.categoryGrid}>
                                {Object.entries(categoryColors).map(([cat, color]) => (
                                    <button
                                        key={cat}
                                        className={`${styles.categoryOption} ${blockCategory === cat ? styles.selected : ''}`}
                                        style={{ '--cat-color': color } as React.CSSProperties}
                                        onClick={() => setBlockCategory(cat as keyof typeof categoryColors)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <button
                                className={`${styles.blockToggle} ${isBlocked ? styles.blocked : ''}`}
                                onClick={() => setIsBlocked(!isBlocked)}
                            >
                                {isBlocked ? <Lock size={16} /> : <Unlock size={16} />}
                                <span>{isBlocked ? 'Blocked (Do not disturb)' : 'Available'}</span>
                            </button>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn btn-primary" onClick={handleAddBlock}>
                                Add Block
                            </button>
                            <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
