import { lib } from "../../../../../noname.js";
import StepCompiler from "./StepCompiler.js";
import YieldCompiler from "./YieldCompiler.js";
import AsyncCompiler from "./AsyncCompiler.js";
import ArrayCompiler from "./ArrayCompiler.js";
class ContentCompiler {
	#compilerTypes = new Set();
	#compilers = new Set();
	#compiledContent = new WeakMap();
	/**
	 * ```plain
	 * 注册一个编译器实例
	 *
	 * 如果后面开始全面迁移到 TypeScript，那么请使用依赖注入代替这个方法喵
	 * ```
	 *
	 * @todo 应该使用依赖注入替代
	 * @param compiler 编译器实例对象
	 */
	addCompiler(compiler) {
		const type = compiler.constructor;
		if (typeof type !== "function") {
			throw new TypeError("content编译器没有明确的类型");
		}
		if (this.#compilerTypes.has(type)) {
			throw new TypeError("相同的content编译器类型不能重复注册");
		}
		this.#compilerTypes.add(type);
		this.#compilers.add(compiler);
	}
	/**
	 * ```plain
	 * 对无法直接编译的数据做处理
	 * ```
	 *
	 * @param content
	 * @returns
	 */
	regularize(content) {
		// 无法直接编译的数据做处理
		if (typeof content === "string") {
			return lib.element.content[content] || lib.element.contents[content];
		} else if (Symbol.iterator in content) {
			return Array.from(content);
		}
		return content;
	}
	/**
	 * ```plain
	 * 集成的编译函数
	 * 通过责任链模式将content分发给所有注册的编译器喵
	 * ```
	 *
	 * @param content
	 */
	compile(content) {
		if (content.compiled) {
			return content;
		}
		const target = this.regularize(content);
		const cached = this.#compiledContent.get(target);
		if (cached) {
			return cached;
		}
		for (const compiler of this.#compilers) {
			if (!compiler.filter(target)) {
				continue;
			}
			const compiled = compiler.compile(target);
			compiled.compiled = true;
			compiled.type = compiler.type;
			compiled.original = content;
			// 对编译结果进行缓存
			this.#compiledContent.set(target, compiled);
			return compiled;
		}
		// 无家可归的可怜孩子喵
		throw new Error(`不受支持的content: \n ${String(target)}`);
	}
}
const compiler = new ContentCompiler();
compiler.addCompiler(new ArrayCompiler());
compiler.addCompiler(new AsyncCompiler());
compiler.addCompiler(new StepCompiler());
compiler.addCompiler(new YieldCompiler());
export default compiler;
