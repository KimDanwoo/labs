export function createElement(tagName, className = '', children = [])
{
    const element = document.createElement(tagName)

    if(className)
        element.className = className

    element.append(...children)

    return element
}
