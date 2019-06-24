/***
 * babel-plugin-react-css-modules
 * @fileoverview babel-plugin-react-css-modules
 * @author yangxi | 599321378@qq.com
 */

const babelPluginSyntaxJSX = require('@babel/plugin-syntax-jsx')
const { transformStringClassName, transformArrayClassName, transformObjectClassName } = require('./core/transform')
let { IMPORT_CSS_MODULE_NAME } = require('./core/constant')

module.exports = function ({ types: t }) {
	let cssModules = []
	let count = 0

	const verify = (path, cssModules = []) => {
		if (cssModules.length === 0) {
			return false
		}
		let res = true
		cssModules.forEach((cssModule) => {
			res = res && path.scope.hasBinding(cssModule.name)
		})
		return res
	}

	return {
		name: 'react-css-modules',
		inherits: babelPluginSyntaxJSX.default,
		visitor: {
			Program () {
				cssModules = []
				count = 0
			},

			ImportDeclaration (path) {
				const { node: { specifiers, source } } = path
				// if (specifiers.length !== 0 || !/\.(?:less|css|s[ac]ss)$/i.test(source.value)) return

				if (!/\.(?:less|css|s[ac]ss)$/i.test(source.value)) return

				if (specifiers.length === 0) {
					const nameIdentifier = path.scope.generateUidIdentifier(`${IMPORT_CSS_MODULE_NAME}${count++}_`)
					const defaultSpecifiers = t.importNamespaceSpecifier(nameIdentifier)
					const importDeclaration = t.importDeclaration([defaultSpecifiers], source)
					path.replaceWith(importDeclaration)
				}

				if (specifiers.length === 1) {
					const [spec] = specifiers
					const { local } = spec
					cssModules.unshift(local)
				}
			},

			JSXAttribute (path) {
				const { node } = path
				const { name } = node.name
				if (!/^className$/.test(name)) {
					return
				}

				path.traverse({
					// 处理 className 为 string 的场景
					StringLiteral (path) {
						if (!verify(path, cssModules)) return
						if (path.parentPath.isJSXAttribute() ||
							(path.parentPath.isJSXExpressionContainer() && path.parentPath.parentPath.isJSXAttribute())) {
							transformStringClassName(path, cssModules)
						}
					},

					// 处理 className 为 array 的场景
					ArrayExpression (path) {
						if (!verify(path, cssModules)) return
						if (path.parentPath.isJSXExpressionContainer() && path.parentPath.parentPath.isJSXAttribute()) {
							transformArrayClassName(path, cssModules)
						}
					},

					// 处理 className 为 json 的场景
					ObjectExpression (path) {
						if (!verify(path, cssModules)) return
						if (path.parentPath.isJSXExpressionContainer() && path.parentPath.parentPath.isJSXAttribute()) {
							transformObjectClassName(path, cssModules)
						}
					}
				})
			}
		}
	}
}