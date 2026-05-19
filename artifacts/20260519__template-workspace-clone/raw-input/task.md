# 原始输入

/Users/zweizhao/project/current/ai-workbench--an/projects/service/.env

我在这里提供了 TEMPLATE_REPO_URL 和 TEMPLATE_ROOT_DIR

当用户创建了一个需求的时候,通过这个 repo 的 main 分支单纯 clone main 分支下来(不要别的分支任何信息,不然会很大).
然后 checkout 一个与这个需求的 hash 一样的分支:task-[hash],随后删除 main 分支. clone 时候的文件夹命名和分支名一样.

注意检测 workspaces 文件夹是否存在,不存在则创建.

---

现在我有需求,但是本地没有文件夹,刚好处理一下边界状态.

需求有,但是本地没有对应的文件夹和分支检测.

在打开详情后,自动检测,若没有,则后端自动创建.创建时候,先检测是否有这个分支,若没有则基于 main 创建这个分支.
流程一样的,能明白吧
