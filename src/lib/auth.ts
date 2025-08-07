import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Check if the credentials match the admin user
                const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
                const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

                const isValidEmail = credentials.email === adminEmail;
                const isValidPassword = credentials.password === adminPassword;

                if (isValidEmail && isValidPassword) {
                    return {
                        id: '1',
                        email: adminEmail,
                        name: 'Admin'
                    };
                }

                return null;
            }
        })
    ],
    callbacks: {
        jwt: async ({ token, user }: any) => {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = 'admin'; // Set role during JWT creation
            }

            return token;
        },
        session: async ({ session, token }: any) => {
            if (session?.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.role = token.role as string;
            }

            return session;
        }
    },
    pages: {
        signIn: '/admin/login',
        error: '/admin/login'
    },
    session: {
        strategy: 'jwt' as const
    },
    secret: process.env.NEXTAUTH_SECRET
};
