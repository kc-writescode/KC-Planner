'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import styles from './Auth.module.css';

export default function AuthComponent() {
    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Perfect Planner</h1>
                    <p className={styles.subtitle}>Your Day, Organized & Synchronized</p>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#7c3aed',
                                    brandAccent: '#6d28d9',
                                    inputBackground: 'rgba(255, 255, 255, 0.05)',
                                    inputText: 'white',
                                    inputPlaceholder: 'rgba(255, 255, 255, 0.4)',
                                    inputBorder: 'rgba(255, 255, 255, 0.1)',
                                },
                                space: {
                                    inputPadding: '12px',
                                    buttonPadding: '12px',
                                },
                                radii: {
                                    borderRadiusButton: '12px',
                                    buttonBorderRadius: '12px',
                                    inputBorderRadius: '12px',
                                }
                            },
                        },
                        className: {
                            button: styles.authButton,
                            input: styles.authInput,
                            label: styles.authLabel,
                        }
                    }}
                    providers={['google']}
                    theme="dark"
                />
            </div>
        </div>
    );
}
