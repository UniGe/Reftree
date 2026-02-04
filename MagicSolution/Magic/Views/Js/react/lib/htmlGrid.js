export const gridClassMapping = {
    3: {
        default: 'xs-',
        extraLarge: 'lg-',
        large: 'lg-',
        medium: 'md-',
        small: 'sm-'
    },
    4: {
        default: '',
        extraLarge: 'xl-',
        large: 'lg-',
        medium: 'md-',
        small: 'sm-'
    }
};

export function getGridClassName(colSpan, bootstrapVersion, offset) {
    let className = '';
    if (typeof colSpan === 'number') {
        className += ` col-${gridClassMapping[bootstrapVersion].default}${colSpan}${offset ? getOffset('default', bootstrapVersion, offset) : ''}`;
    }
    else {
        for (const [ key, value ] of Object.entries(colSpan)) {
            className += ` col-${gridClassMapping[bootstrapVersion][key]}${value}${offset && offset[key] ? getOffset(key, bootstrapVersion, offset) : ''}`;
        }
    }
    return className;
}

function getOffset(screenSize, bootstrapVersion, offset) {
    if (bootstrapVersion === 3) {
        return ` col-${gridClassMapping[bootstrapVersion][screenSize]}offset-${offset}`;
    }
    return ` offset-${gridClassMapping[bootstrapVersion][screenSize]}-${offset}`;
}