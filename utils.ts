
export const calculateAge = (birthday: string | undefined | null): string | number => {
  if (!birthday || birthday === 'null' || birthday === 'undefined') return 'N/A';
  
  try {
    let birthDate: Date;
    
    // Handle YYYY-MM-DD (ISO)
    if (birthday.includes('-')) {
      const parts = birthday.split('-');
      if (parts[0].length === 4) {
        birthDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } 
    // Handle DD/MM/YYYY
    else if (birthday.includes('/')) {
      const parts = birthday.split('/');
      if (parts[0].length === 4) {
        birthDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    else {
      birthDate = new Date(birthday);
    }

    if (isNaN(birthDate.getTime())) return 'N/A';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (e) {
    return 'N/A';
  }
};
