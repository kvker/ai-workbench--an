# 原始输入

当请求详情页时候,需要做一个加载 SKILLS 的功能.

环境变量添加了如下:

KNOWLEDGE_ROOT_DIR=../../../qingtian-harness
PM_SKILLS=pm-raw,pm-demo,pm-handoff

pm 的 skills 在 $KNOWLEDGE_ROOT_DIR/pm/ 下面

我们设定一下流程有个序号,从 0 开始,目前设计是到 9. 当前需求分析就是 0.

如果序号小于 3, 则自动加载 pm 的 skills. (加载就是将 pm 的几个 skills 拷贝到代码区工程的.codex/skills/ 文件夹下(覆盖).

请撰写这个代码, 最终目的是让我们可以在流程中,通过 AI 可以直接使用对应的技能.
