export function autoBinding(object, property, compute)
{
    return {
        update: () =>
        {
            if(compute)
                object[property] = compute()
        },
    }
}
