const { LeaveType } = require('../models');
const { sequelize } = require('../config/db');

const seedLeaveTypes = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        const types = [
            { code: 'CL', name: 'Casual Leave', min_notice_days: 2, allow_past_dates: false },
            { code: 'SL', name: 'Sick Leave', min_notice_days: 0, allow_past_dates: true },
            { code: 'AL', name: 'Annual Leave', min_notice_days: 7, allow_past_dates: false },
            { code: 'PL', name: 'Privilege Leave', min_notice_days: 14, allow_past_dates: false },
            { code: 'HL', name: 'Hajj Leave', min_notice_days: 30, allow_past_dates: false }
        ];

        for (const type of types) {
            await LeaveType.findOrCreate({
                where: { code: type.code },
                defaults: type
            });
        }

        console.log('Leave Types Seeded!');
        process.exit();
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedLeaveTypes();
